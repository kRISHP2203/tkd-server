import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('✅ WebSocket server started on ws://localhost:8080');

wss.on('connection', ws => {
  console.log('🔌 New client connected');

  ws.on('error', console.error);

  ws.on('message', data => {
    console.log('📩 Received message:', data.toString());
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
  });
});
