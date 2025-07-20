import { WebSocketServer, WebSocket } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('✅ WebSocket server started on ws://localhost:8080');

wss.on('connection', ws => {
  console.log('🔌 New client connected');

  ws.on('error', console.error);

  ws.on('message', (data: Buffer) => {
    const message = data.toString();
    console.log('📩 Received message:', message);

    // Broadcast the message to all other connected clients
    wss.clients.forEach(client => {
      // Don't send the message back to the sender
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
  });
});
