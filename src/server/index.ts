
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

const wss = new WebSocketServer({ port: 8080 });

// State Management
let signalQueue: Signal[] = [];
const processedSignatures: Set<string> = new Set();
const clientData = new Map<string, { licenseKey?: string | null, deviceId?: string }>();

console.log('✅ WebSocket server started on ws://localhost:8080');

// Helper Functions
const broadcastToLicense = (licenseKey: string | null, data: any) => {
    const key = licenseKey || 'free';
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        const clientKey = ws.licenseKey || 'free';
        if (clientKey === key && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
};

const getRefereeCountForLicense = (licenseKey: string | null): number => {
    let count = 0;
    const key = licenseKey || 'free';
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        const clientKey = ws.licenseKey || 'free';
        if (clientKey === key && ws.type === 'referee') {
            count++;
        }
    });
    return count;
};

const getRequiredConfirmations = (licenseKey: string | null): number => {
    const refereeCount = getRefereeCountForLicense(licenseKey);
    if (refereeCount <= 1) return 1;
    if (refereeCount === 2) return 2;
    if (refereeCount >= 4) return 3;
    return 2; // Default for 3 referees
};

const processSignalQueue = (licenseKey: string | null) => {
    const requiredConfirmations = getRequiredConfirmations(licenseKey);
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
        const licenseIdentifier = licenseKey || 'free';
        const fullSignature = `${licenseIdentifier}:${signature}`;
        if (processedSignatures.has(fullSignature)) {
            return;
        }

        if (signals.length >= requiredConfirmations) {
            const confirmedSignal = signals[0];
            console.log(`✅ Valid point confirmed for ${licenseIdentifier}. Required: ${requiredConfirmations}, Got: ${signals.length}`);

            broadcastToLicense(licenseKey, {
                action: 'score',
                team: confirmedSignal.target,
                points: confirmedSignal.value,
            });

            processedSignatures.add(fullSignature);
            setTimeout(() => processedSignatures.delete(fullSignature), 5000); // Prevent re-triggering

            signalQueue = signalQueue.filter(s => {
                const sSignature = `${s.target}:${s.technique}:${s.value}`;
                return sSignature !== signature;
            });
        }
    });
};

const getRefereeListForLicense = (licenseKey: string | null) => {
    const referees: { id: string, status: 'connected' | 'disconnected', lastSeen: string }[] = [];
    const key = licenseKey || 'free';
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        const clientKey = ws.licenseKey || 'free';
        if (clientKey === key && ws.type === 'referee') {
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
    customWs.licenseKey = null;

    console.log(`🔌 New client connected: ${customWs.id}`);

    ws.on('pong', () => { customWs.isAlive = true; });
    ws.on('error', console.error);

    ws.on('message', async (data: Buffer) => {
        try {
            const message = JSON.parse(data.toString());
            const { licenseKey, deviceId, action } = message;

            // Registration for all clients
            if (action === 'register_ui' || action === 'register_referee') {
                customWs.deviceId = deviceId;
                let plan: 'free' | 'basic' | 'elite' = 'free';

                if (licenseKey) {
                    const licenseData = await verifyLicense(licenseKey);
                    if (licenseData) {
                        customWs.licenseKey = licenseKey;
                        plan = licenseData.plan;
                    }
                }
                
                clientData.set(customWs.id, { licenseKey: customWs.licenseKey, deviceId });
                
                if (action === 'register_referee') {
                    // Admin key bypasses referee limits
                    if (customWs.licenseKey !== ADMIN_LICENSE_KEY) {
                        const limits = await getPlanLimits(plan);
                        const currentReferees = getRefereeCountForLicense(customWs.licenseKey);
                        
                        if (currentReferees >= limits.maxReferees) {
                            console.log(`❌ Referee limit reached for ${customWs.licenseKey || 'free'}. Limit: ${limits.maxReferees}`);
                            ws.send(JSON.stringify({ error: 'MAX_REFEREES_REACHED', limit: limits.maxReferees, plan: plan }));
                            return ws.terminate();
                        }
                    }
                }
                customWs.type = action === 'register_ui' ? 'ui' : 'referee';
                console.log(`🤝 Client ${customWs.id.substring(0,8)} registered to license ${String(customWs.licenseKey).substring(0,8)} as ${customWs.type}`);
                broadcastToLicense(customWs.licenseKey, { action: 'referee_list', referees: getRefereeListForLicense(customWs.licenseKey) });
                return;
            }

            // Actions for registered clients
            switch (action) {
                case 'get_referees':
                    broadcastToLicense(customWs.licenseKey, { action: 'referee_list', referees: getRefereeListForLicense(customWs.licenseKey) });
                    break;
                case 'reset_connections':
                    wss.clients.forEach(client => {
                        const c = client as CustomWebSocket;
                        if (c.licenseKey === customWs.licenseKey && c.type === 'referee') {
                           c.terminate();
                        }
                    });
                    break;
                case 'score':
                case 'penalty':
                     if (message.source === 'judge_control') {
                         broadcastToLicense(customWs.licenseKey, message);
                     }
                    break;
                case 'score_point':
                     if (customWs.type !== 'referee') return;
                     const signal: Signal = {
                        refereeId: customWs.id,
                        target: message.target,
                        technique: message.technique,
                        value: message.value,
                        timestamp: Date.now(),
                    };
                    signalQueue.push(signal);
                    processSignalQueue(customWs.licenseKey);
                    break;
            }
        } catch (e) {
            console.error("Error processing message:", e);
        }
    });

    ws.on('close', () => {
        const clientInfo = clientData.get(customWs.id);
        console.log(`🔌 Client disconnected: ${customWs.id}`);
        if (clientInfo) {
            broadcastToLicense(clientInfo.licenseKey, { action: 'referee_list', referees: getRefereeListForLicense(clientInfo.licenseKey) });
            // In a real app, you might want to delay this to handle brief disconnects
            // if (clientInfo.licenseKey && clientInfo.deviceId) {
            //     removeDeviceFromLicense(clientInfo.licenseKey, clientInfo.deviceId);
            // }
        }
        clientData.delete(customWs.id);
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
    // If the queue was populated but is now empty, clear the processed signatures cache.
    // This prevents memory bloat between matches.
    if (beforeCount > 0 && signalQueue.length === 0) {
        processedSignatures.clear();
        console.log('🚮 Cleared processed signal signatures cache.');
    }
}, 5000);

wss.on('close', () => {
    clearInterval(interval);
});
