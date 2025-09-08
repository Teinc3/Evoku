import 'dotenv/config';

import serverConfig from '../../config/server.json' with { type: 'json' };
import WSServer from './core/WSServer';
import HTTPServer from './core/HTTPServer';
import PacketRegistry from '@shared/networking/registry';


// Determine port preference: explicit env override OR config
const port = serverConfig.port;
if (port < 0 || port > 65535) {
  throw new Error(`Invalid port resolved: "${port}". Must be an integer between 0 and 65535.`);
}

async function bootstrap() {
  // Pre-load all packets to ensure they're registered
  await PacketRegistry.ensurePacketsLoaded();
  
  // Create and start the HTTP server
  const httpServer = new HTTPServer(port);
  httpServer.start();

  // Create the WebSocket server
  const wsServer = new WSServer(httpServer.server);

  // Set up listeners for graceful shutdown for both servers
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach(signal => {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      // Close both servers in sequence
      wsServer.close();
      httpServer.close();
      process.exit(0);
    });
  });
}

bootstrap().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});