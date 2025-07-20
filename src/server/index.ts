
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Add custom properties to the WebSocket type
interface RefereeWebSocket extends WebSocket {
  id: string;
  isAlive: boolean;
}

// Define the structure for a scoring signal
interface Signal {
  refereeId: string;
  target: 'red' | 'blue';
  technique: 'trunk' | 'head' | 'punch';
  value: number;
  timestamp: number;
}

const wss = new WebSocketServer({ port: 8080 });

let signalQueue: Signal[] = [];
let processedSignatures: Set<string> = new Set();

console.log('✅ WebSocket server started on ws://localhost:8080');

const broadcast = (data: any) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

const getRequiredConfirmations = () => {
  const refereeCount = wss.clients.size;
  if (refereeCount <= 1) return 1;
  if (refereeCount === 2) return 2;
  if (refereeCount === 3) return 2;
  return 3;
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
    groupedSignals.get(signature)!.push(signal);
  }

  groupedSignals.forEach((signals, signature) => {
    if (processedSignatures.has(signature)) {
      return;
    }

    const uniqueReferees = new Set(signals.map(s => s.refereeId));

    if (uniqueReferees.size >= requiredConfirmations) {
      const confirmedSignal = signals[0];

      console.log(
        `✅ Valid point confirmed for ${confirmedSignal.target} team! ` +
        `Required: ${requiredConfirmations}, ` +
        `Got: ${uniqueReferees.size}. ` +
        `Referees: [${Array.from(uniqueReferees).map(id => id.substring(0, 8)).join(', ')}]`
      );

      broadcast({
        action: 'score',
        team: confirmedSignal.target,
        points: confirmedSignal.value,
      });

      processedSignatures.add(signature);
      
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
        const refereeWs = client as RefereeWebSocket;
        if (refereeWs.id) {
            referees.push({
                id: refereeWs.id,
                status: 'connected',
                lastSeen: new Date().toISOString()
            });
        }
    });
    return referees;
};


wss.on('connection', ws => {
  const refereeWs = ws as RefereeWebSocket;
  refereeWs.id = uuidv4();
  refereeWs.isAlive = true;

  console.log(`🔌 New client connected: ${refereeWs.id}. Total referees: ${wss.clients.size}`);
  
  // Notify all clients about the new referee list
  broadcast({ action: 'referee_list', referees: getRefereeList() });

  ws.on('pong', () => {
    refereeWs.isAlive = true;
  });

  ws.on('error', console.error);

  ws.on('message', (data: Buffer) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📩 Received message from ${refereeWs.id.substring(0,8)}...:`, message);

        if (message.action === 'get_referees') {
            ws.send(JSON.stringify({ action: 'referee_list', referees: getRefereeList() }));
            return;
        }

        if (message.action === 'reset_connections') {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.terminate();
                }
            });
            return;
        }

        if (message.action === 'penalty' || (message.action === 'score' && message.source === 'judge_control')) {
            broadcast(message);
            return;
        }

        if (message.target && message.technique && message.value !== undefined) {
            if (getRequiredConfirmations() === 1) {
                console.log(`✅ Point directly processed for single referee: ${refereeWs.id.substring(0,8)}`);
                broadcast({
                    action: 'score',
                    team: message.target,
                    points: message.value
                });
                return;
            }

            const signal: Signal = {
              refereeId: refereeWs.id,
              target: message.target,
              technique: message.technique,
              value: message.value,
              timestamp: Date.now(),
            };

            signalQueue.push(signal);
            processSignalQueue();
        } else {
             broadcast(data.toString());
        }
    } catch(e) {
        console.error("Error processing message:", e);
        broadcast(data.toString());
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Client disconnected: ${refereeWs.id}. Total referees: ${wss.clients.size}`);
    // Notify remaining clients about the change in referee list
    broadcast({ action: 'referee_list', referees: getRefereeList() });
  });
});


const interval = setInterval(() => {
  // Health check for all clients
  wss.clients.forEach(client => {
    const refereeWs = client as RefereeWebSocket;
    if (refereeWs.isAlive === false) {
      console.log(`💔 Terminating inactive client: ${refereeWs.id}`);
      return refereeWs.terminate();
    }
    refereeWs.isAlive = false;
    refereeWs.ping();
  });
  
  // Cleanup for signal queue
  const now = Date.now();
  const beforeCount = signalQueue.length;
  signalQueue = signalQueue.filter(s => s.timestamp >= now - 5000);
  processedSignatures.clear();

  if (beforeCount > signalQueue.length) {
      console.log(`🧹 Cleanup: Removed ${beforeCount - signalQueue.length} expired signals.`);
  }
}, 5000);

wss.on('close', () => {
  clearInterval(interval);
});
