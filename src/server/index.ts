
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { verifyLicense, getPlanLimits } from '@/lib/auth-service';
import dotenv from 'dotenv';

dotenv.config();

const ADMIN_LICENSE_KEY = 'admin-master-key-unlimited';

interface CustomWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  type: 'referee' | 'ui' | 'unknown';
  deviceId?: string;
}

interface Signal {
  refereeId: string;
  target: 'red' | 'blue';
  technique: 'trunk' | 'head' | 'punch';
  value: number;
  timestamp: number;
}

const wss = new WebSocketServer({ port: 8000 });

// --- Server State Management ---
let signalQueue: Signal[] = [];
const processedSignatures: Set<string> = new Set();
let serverPlan: 'free' | 'basic' | 'elite' = 'free';
let maxRefereesForPlan: number = 1;

// --- Server Initialization ---
console.log('✅ WebSocket server started on ws://localhost:8000');

// Load license and set plan limits at startup
const initializeServerState = async () => {
    const licenseKey = process.env.LICENSE_KEY || null;
    console.log(`🔑 Initializing server with license key from .env: ${licenseKey ? `${licenseKey.substring(0, 8)}...` : 'None'}`);
    
    if (licenseKey) {
        const licenseData = await verifyLicense(licenseKey);
        if (licenseData) {
            serverPlan = licenseData.plan;
            const limits = await getPlanLimits(serverPlan);
            maxRefereesForPlan = limits.maxReferees;
            console.log(`✅ Server plan set to '${serverPlan}'. Max referees: ${maxRefereesForPlan}.`);
        } else {
            console.warn(`⚠️ Invalid license key found in .env. Defaulting to 'free' plan.`);
            serverPlan = 'free';
            maxRefereesForPlan = 1;
        }
    } else {
        console.log(`ℹ️ No license key in .env. Server running on 'free' plan.`);
        serverPlan = 'free';
        maxRefereesForPlan = 1;
    }
};

initializeServerState();


// --- Helper Functions ---
const broadcast = (data: any) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

const getRefereeCount = (): number => {
    let count = 0;
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        if (ws.type === 'referee') {
            count++;
        }
    });
    return count;
};

const getRequiredConfirmations = (): number => {
    const refereeCount = getRefereeCount();
    if (refereeCount <= 1) return 1;
    if (refereeCount === 2) return 2;
    if (refereeCount >= 4) return 3;
    return 2; // Default for 3 referees
};

const processSignalQueue = () => {
    const requiredConfirmations = getRequiredConfirmations();
    const now = Date.now();
    const fiveSecondsAgo = now - 5000;

    const recentSignals = signalQueue.filter(s => s.timestamp >= fiveSecondsAgo);
    const groupedSignals = new Map<string, Signal[]>();

    for (const signal of recentSignals) {
        const signature = `${signal.target}:${signal.technique}:${signal.value}`;
        if (!groupedSignals.has(signature)) {
            groupedSignals.set(signature, []);
        }
        const group = groupedSignals.get(signature)!;
        if (!group.some(s => s.refereeId === signal.refereeId)) {
            group.push(signal);
        }
    }

    groupedSignals.forEach((signals, signature) => {
        if (processedSignatures.has(signature)) {
            return;
        }

        if (signals.length >= requiredConfirmations) {
            const confirmedSignal = signals[0];
            console.log(`✅ Valid point confirmed. Required: ${requiredConfirmations}, Got: ${signals.length}`);

            broadcast({
                action: 'score',
                team: confirmedSignal.target,
                points: confirmedSignal.value,
            });

            processedSignatures.add(signature);
            setTimeout(() => processedSignatures.delete(signature), 5000);

            signalQueue = signalQueue.filter(s => {
                const sSignature = `${s.target}:${s.technique}:${s.value}`;
                return sSignature !== signature;
            });
        }
    });
};

const getRefereeList = () => {
    const referees: { id: string, status: 'connected' | 'disconnected', lastSeen: string }[] = [];
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        if (ws.type === 'referee') {
            referees.push({ id: ws.id, status: 'connected', lastSeen: new Date().toISOString() });
        }
    });
    return referees;
};

// --- WebSocket Server Logic ---
wss.on('connection', ws => {
    const customWs = ws as CustomWebSocket;
    customWs.id = uuidv4();
    customWs.isAlive = true;
    customWs.type = 'unknown';

    console.log(`🔌 New client connected: ${customWs.id}`);

    ws.on('pong', () => { customWs.isAlive = true; });
    ws.on('error', console.error);

    ws.on('message', async (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());
            const { deviceId, action } = message;

            if (action === 'register_ui') {
                customWs.type = 'ui';
                customWs.deviceId = deviceId;
                console.log(`🖥️ UI client registered: ${deviceId}`);
                ws.send(JSON.stringify({ action: 'referee_list', referees: getRefereeList() }));
                return;
            }

            if (action === 'register_referee') {
                customWs.type = 'referee';
                customWs.deviceId = deviceId;
                
                const currentReferees = getRefereeCount();
                
                if (currentReferees >= maxRefereesForPlan) {
                    console.log(`❌ Referee limit reached for plan '${serverPlan}'. Limit: ${maxRefereesForPlan}`);
                    ws.send(JSON.stringify({ error: 'MAX_REFEREES_REACHED', limit: maxRefereesForPlan, plan: serverPlan }));
                    return ws.terminate();
                }
                
                console.log(`🤝 Referee ${customWs.id.substring(0,8)} registered. (${currentReferees + 1}/${maxRefereesForPlan})`);
                broadcast({ action: 'referee_list', referees: getRefereeList() });
                return;
            }

            // Actions for registered clients
            switch (action) {
                case 'get_referees':
                    ws.send(JSON.stringify({ action: 'referee_list', referees: getRefereeList() }));
                    break;
                case 'reset_connections':
                    wss.clients.forEach(client => {
                        const c = client as CustomWebSocket;
                        if (c.type === 'referee') {
                           c.terminate();
                        }
                    });
                    break;
                case 'score':
                case 'penalty':
                     if (message.source === 'judge_control') {
                         broadcast(message);
                     } else if (customWs.type === 'referee') {
                        const signal: Signal = {
                           refereeId: customWs.id,
                           target: message.target,
                           technique: message.technique || 'trunk',
                           value: message.points,
                           timestamp: Date.now(),
                       };
                       signalQueue.push(signal);
                       processSignalQueue();
                    }
                    break;
            }
        } catch (e) {
            console.error("Error processing message:", e);
        }
    });

    ws.on('close', () => {
        console.log(`🔌 Client disconnected: ${customWs.id}`);
        broadcast({ action: 'referee_list', referees: getRefereeList() });
    });
});

// --- Health Check and Cleanup ---
const interval = setInterval(() => {
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        if (ws.isAlive === false) {
            console.log(`💔 Terminating unresponsive client: ${ws.id}`);
            return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
    });

    const now = Date.now();
    const beforeCount = signalQueue.length;
    signalQueue = signalQueue.filter(s => s.timestamp >= now - 5000);
    if (beforeCount > 0 && signalQueue.length === 0) {
        processedSignatures.clear();
    }
}, 5000);

wss.on('close', () => {
    clearInterval(interval);
});
