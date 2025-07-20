
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { verifyLicense, getPlanLimits, removeDeviceFromLicense } from '@/lib/auth-service';

interface CustomWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
  type: 'referee' | 'ui' | 'unknown';
  licenseKey?: string;
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
let processedSignatures: Set<string> = new Set();
const clientData = new Map<string, { licenseKey?: string, deviceId?: string }>();

console.log('✅ WebSocket server started on ws://localhost:8080');

// Helper Functions
const broadcastToLicense = (licenseKey: string, data: any) => {
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        if (ws.licenseKey === licenseKey && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    });
};

const getRefereeCountForLicense = (licenseKey: string): number => {
    let count = 0;
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        if (ws.licenseKey === licenseKey && ws.type === 'referee') {
            count++;
        }
    });
    return count;
};

const getRequiredConfirmations = (licenseKey: string): number => {
    const refereeCount = getRefereeCountForLicense(licenseKey);
    if (refereeCount <= 1) return 1;
    if (refereeCount === 2) return 2;
    if (refereeCount === 3) return 2;
    return 3;
};

const processSignalQueue = (licenseKey: string) => {
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
        // Ensure one signal per referee in a group
        if (!group.some(s => s.refereeId === signal.refereeId)) {
            group.push(signal);
        }
    }

    groupedSignals.forEach((signals, signature) => {
        const fullSignature = `${licenseKey}:${signature}`;
        if (processedSignatures.has(fullSignature)) {
            return;
        }

        if (signals.length >= requiredConfirmations) {
            const confirmedSignal = signals[0];
            console.log(`✅ Valid point confirmed for ${licenseKey}. Required: ${requiredConfirmations}, Got: ${signals.length}`);

            broadcastToLicense(licenseKey, {
                action: 'score',
                team: confirmedSignal.target,
                points: confirmedSignal.value,
            });

            processedSignatures.add(fullSignature);
            signalQueue = signalQueue.filter(s => {
                const sSignature = `${s.target}:${s.technique}:${s.value}`;
                return sSignature !== signature;
            });
        }
    });
};

const getRefereeListForLicense = (licenseKey: string) => {
    const referees: { id: string, status: 'connected' | 'disconnected', lastSeen: string }[] = [];
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        if (ws.licenseKey === licenseKey && ws.type === 'referee') {
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
            const { licenseKey, deviceId, action } = message;

            // Initial connection registration
            if (!customWs.licenseKey && licenseKey) {
                const licenseData = await verifyLicense(licenseKey);
                if (!licenseData) {
                    ws.send(JSON.stringify({ error: 'INVALID_LICENSE' }));
                    return ws.terminate();
                }

                customWs.licenseKey = licenseKey;
                customWs.deviceId = deviceId;
                clientData.set(customWs.id, { licenseKey, deviceId });

                const limits = getPlanLimits(licenseData.plan);
                const currentReferees = getRefereeCountForLicense(licenseKey);
                
                if (action !== 'register_ui' && currentReferees >= limits.maxReferees) {
                    console.log(`❌ Referee limit reached for ${licenseKey}. Limit: ${limits.maxReferees}`);
                    ws.send(JSON.stringify({ error: 'MAX_REFEREES_REACHED', limit: limits.maxReferees }));
                    return ws.terminate();
                }
                customWs.type = action === 'register_ui' ? 'ui' : 'referee';
                console.log(`🤝 Client ${customWs.id.substring(0,8)} registered to license ${licenseKey.substring(0,8)} as ${customWs.type}`);
            }

            // Actions for registered clients
            if (!customWs.licenseKey) return;
            
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
                     // From judge controls or confirmed point
                    if (message.source === 'judge_control') {
                         broadcastToLicense(customWs.licenseKey, message);
                    }
                    break;
                case 'score_point': // Raw signal from referee
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
        if (clientInfo?.licenseKey) {
            broadcastToLicense(clientInfo.licenseKey, { action: 'referee_list', referees: getRefereeListForLicense(clientInfo.licenseKey) });
            // If it was a UI client, deregister the device
            if (customWs.type === 'ui' && clientInfo.deviceId) {
                removeDeviceFromLicense(clientInfo.licenseKey, clientInfo.deviceId);
            }
        }
        clientData.delete(customWs.id);
    });
});

// Health check and cleanup interval
const interval = setInterval(() => {
    wss.clients.forEach(client => {
        const ws = client as CustomWebSocket;
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
    });

    const now = Date.now();
    const beforeCount = signalQueue.length;
    signalQueue = signalQueue.filter(s => s.timestamp >= now - 5000);
    if (beforeCount > signalQueue.length) {
        processedSignatures.clear();
        console.log(`🧹 Cleanup: Removed ${beforeCount - signalQueue.length} expired signals.`);
    }
}, 5000);

wss.on('close', () => {
    clearInterval(interval);
});
