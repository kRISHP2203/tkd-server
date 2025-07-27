
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { verifyLicense, getPlanLimits, removeDeviceFromLicense } from '@/lib/auth-service';

const ADMIN_LICENSE_KEY = 'admin-master-key-unlimited';

interface CustomWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  type: 'referee' | 'ui' | 'unknown';
  licenseKey?: string | null;
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

// State Management
let signalQueue: Signal[] = [];
const processedSignatures: Set<string> = new Set();
const clientData = new Map<string, { deviceId?: string }>();
let serverLicenseKey: string | null = null;
let serverPlan: 'free' | 'basic' | 'elite' = 'free';

console.log('✅ WebSocket server started on ws://localhost:8000');

// Helper Functions
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
            setTimeout(() => processedSignatures.delete(signature), 5000); // Prevent re-triggering

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

// WebSocket Server Logic
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
                serverLicenseKey = message.licenseKey;
                const licenseData = await verifyLicense(serverLicenseKey);
                serverPlan = licenseData ? licenseData.plan : 'free';
                console.log(`🖥️ UI registered for license ${String(serverLicenseKey).substring(0,8)} with plan: ${serverPlan}`);
                broadcast({ action: 'referee_list', referees: getRefereeList() });
                return;
            }

            if (action === 'register_referee') {
                customWs.type = 'referee';
                customWs.deviceId = deviceId;
                
                if (serverLicenseKey !== ADMIN_LICENSE_KEY) {
                    const limits = await getPlanLimits(serverPlan);
                    const currentReferees = getRefereeCount();
                    
                    if (currentReferees >= limits.maxReferees) {
                        console.log(`❌ Referee limit reached for plan ${serverPlan}. Limit: ${limits.maxReferees}`);
                        ws.send(JSON.stringify({ error: 'MAX_REFEREES_REACHED', limit: limits.maxReferees, plan: serverPlan }));
                        return ws.terminate();
                    }
                }
                
                console.log(`🤝 Referee ${customWs.id.substring(0,8)} registered.`);
                broadcast({ action: 'referee_list', referees: getRefereeList() });
                return;
            }

            // Actions for registered clients
            switch (action) {
                case 'get_referees':
                    broadcast({ action: 'referee_list', referees: getRefereeList() });
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

// Health check and cleanup interval
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
        console.log('🚮 Cleared processed signal signatures cache.');
    }
}, 5000);

wss.on('close', () => {
    clearInterval(interval);
});
