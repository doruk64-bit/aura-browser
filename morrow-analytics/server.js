const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });
console.log('[Morrow Analytics] Local WebSocket Server started on ws://localhost:8080');

// { wsId: { presenceData } }
const connectedClients = new Map();

function broadcastState() {
  const payload = JSON.stringify({
    type: 'sync',
    state: Array.from(connectedClients.values()),
  });

  for (const client of wss.clients) {
    if (client.readyState === 1) { // OPEN
      client.send(payload);
    }
  }
}

let connectionIdCounter = 1;

wss.on('connection', (ws) => {
  const clientId = `user_${connectionIdCounter++}`;
  let clientIsBrowser = false; // Is it the dashboard observing or the browser sending telemetry?

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'track') {
        clientIsBrowser = true;
        // Upsert state and broadcast to everyone
        connectedClients.set(clientId, { id: clientId, ...data.payload });
        broadcastState();
      }
    } catch (e) {
      console.error('[WS Error] Error parsing message:', e.message);
    }
  });

  ws.on('close', () => {
    if (clientIsBrowser) {
      connectedClients.delete(clientId);
      broadcastState();
    }
  });
});
