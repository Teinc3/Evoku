import "@shared/networking/packets";
import redisService from "./services/redis";
import { HTTPServer, WSServer } from './core';
import serverConfig from './config';


// Determine port preference: explicit env override OR config
const port = serverConfig.networking.port;
if (port < 0 || port > 65535) {
  throw new Error(`Invalid port resolved: "${port}". Must be an integer between 0 and 65535.`);
}

async function bootstrap() {
  // Initialize Redis connection before starting servers
  await redisService.connect(process.env['REDIS_URL']);
  
  // Create and start the HTTP server
  const httpServer = new HTTPServer(port);
  await httpServer.start();

  // Create the WebSocket server
  const wsServer = new WSServer(httpServer.server);

  // Connect HTTP server to WS server managers for stats
  httpServer.setWsServer(wsServer);

  // Set up listeners for graceful shutdown for both servers
  const signals = ['SIGINT', 'SIGTERM'];
  signals.forEach(signal => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down gracefully...`);

      // Close both servers in sequence
      wsServer.close();
      httpServer.close();

      // Disconnect from Redis
      await redisService.disconnect();

      // Finally kill the process
      process.exit(0);
    });
  });
}

bootstrap();
