import { loadEnvironment, getRequiredEnv } from '../shared/utils/environment';
import WSServer from './core/WSServer';
import HTTPServer from './core/HTTPServer';


// Load environment variables based on NODE_ENV
loadEnvironment();
const portStr = getRequiredEnv('BACKEND_PORT');
const PORT = Number.parseInt(portStr, 10);
if (Number.isNaN(PORT) || PORT < 0 || PORT > 65535) {
  throw new Error(`Invalid BACKEND_PORT: "${portStr}". Must be an integer between 0 and 65535.`);
}

function bootstrap() {
  // Create and start the HTTP server
  const httpServer = new HTTPServer(PORT);
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

bootstrap();