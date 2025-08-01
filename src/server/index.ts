import WSServer from './core/WSServer';
import HTTPServer from './core/HTTPServer';


// Load configuration from environment variables
const PORT = parseInt(process.env['BACKEND_PORT'] || '8745');

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