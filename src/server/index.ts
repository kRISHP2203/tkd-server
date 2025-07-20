
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

// Add a custom property to the WebSocket type to store referee ID
interface RefereeWebSocket extends WebSocket {
  id: string;
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

// In-memory queue for referee signals
let signalQueue: Signal[] = [];
// In-memory store for recently processed signals to prevent duplicates
let processedSignatures: Set<string> = new Set();


console.log('✅ WebSocket server started on ws://localhost:8080');

// Function to determine required confirmations based on referee count
const getRequiredConfirmations = () => {
  const refereeCount = wss.clients.size;
  if (refereeCount <= 1) return 1;
  if (refereeCount === 2) return 2;
  if (refereeCount === 3) return 2;
  return 3; // For 4 or more referees
};

// Function to process the signal queue and check for consensus
const processSignalQueue = () => {
  const requiredConfirmations = getRequiredConfirmations();
  const now = Date.now();
  const fiveSecondsAgo = now - 5000;

  // Filter for signals within the time window
  const recentSignals = signalQueue.filter(s => s.timestamp >= fiveSecondsAgo);
  
  // Group signals by target, technique, and value
  const groupedSignals = new Map<string, Signal[]>();

  for (const signal of recentSignals) {
    const signature = `${signal.target}:${signal.technique}:${signal.value}`;
    if (!groupedSignals.has(signature)) {
      groupedSignals.set(signature, []);
    }
    groupedSignals.get(signature)!.push(signal);
  }

  // Check each group for consensus
  groupedSignals.forEach((signals, signature) => {
    // Ensure we haven't already processed this exact point event
    if (processedSignatures.has(signature)) {
      return;
    }

    // Count unique referees for the current signal group
    const uniqueReferees = new Set(signals.map(s => s.refereeId));

    if (uniqueReferees.size >= requiredConfirmations) {
      const confirmedSignal = signals[0]; // All signals in this group are the same type

      // A valid point is confirmed
      console.log(
        `✅ Valid point confirmed for ${confirmedSignal.target} team! ` +
        `Required: ${requiredConfirmations}, ` +
        `Got: ${uniqueReferees.size}. ` +
        `Referees: [${Array.from(uniqueReferees).join(', ')}]`
      );
      
      // The UI expects a simple score action
      const messageToUI = JSON.stringify({
        action: 'score', // Assuming all signals are for scores
        team: confirmedSignal.target,
        points: confirmedSignal.value,
      });
      
      // Broadcast the confirmed point to all clients (the UI)
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageToUI);
        }
      });
      
      // Mark this event signature as processed to avoid duplicates
      processedSignatures.add(signature);
      
      // Clean the processed signals from the main queue
      signalQueue = signalQueue.filter(s => {
        const sSignature = `${s.target}:${s.technique}:${s.value}`;
        return sSignature !== signature;
      });
    }
  });
};

// Main connection handler
wss.on('connection', ws => {
  const refereeWs = ws as RefereeWebSocket;
  refereeWs.id = uuidv4(); // Assign a unique ID to each connected referee

  console.log(`🔌 New client connected: ${refereeWs.id}. Total referees: ${wss.clients.size}`);
  
  ws.on('error', console.error);

  ws.on('message', (data: Buffer) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📩 Received message from ${refereeWs.id}:`, message);

        // Handle direct UI actions (e.g., from judge controls for penalties)
        if (message.action === 'penalty' || (message.action === 'score' && message.source === 'judge_control')) {
            const messageToBroadcast = JSON.stringify(message);
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(messageToBroadcast);
                }
            });
            return;
        }

        // Handle scoring signals from referees
        if (message.target && message.technique && message.value !== undefined) {
             // Handle the 1-referee case directly
            if (getRequiredConfirmations() === 1) {
                console.log(`✅ Point directly processed for single referee: ${refereeWs.id}`);
                const directMessage = JSON.stringify({
                    action: 'score',
                    team: message.target,
                    points: message.value
                });
                wss.clients.forEach(client => client.send(directMessage));
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
             // If it's not a known format, just broadcast it (old behavior)
             wss.clients.forEach(client => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(data.toString());
                }
            });
        }
    } catch(e) {
        console.error("Error processing message:", e);
        // Fallback for non-JSON messages
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(data);
            }
        });
    }
  });

  ws.on('close', () => {
    console.log(`🔌 Client disconnected: ${refereeWs.id}. Total referees: ${wss.clients.size}`);
  });
});

// Cleanup loop to remove old signals and processed signatures
setInterval(() => {
    const now = Date.now();
    const beforeCount = signalQueue.length;
    
    // Remove signals older than 5 seconds
    signalQueue = signalQueue.filter(s => s.timestamp >= now - 5000);
    
    // Clear the processed signatures set periodically to allow for new scoring events
    processedSignatures.clear();

    if (beforeCount > signalQueue.length) {
        console.log(`🧹 Cleanup: Removed ${beforeCount - signalQueue.length} expired signals.`);
    }
}, 5000);

// Add uuid dependency
// In your terminal run: npm install uuid @types/uuid
// I'll add it to the package.json for you.
