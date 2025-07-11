import WSServer from './WSServer';


// Load configuration from environment variables
const PORT = parseInt(process.env['BACKEND_PORT'] || '8745', 10);

function bootstrap() {
    // 1. Create a new server instance
    const server = new WSServer(PORT);

    // 2. Start the server
    server.start();

    // 3. Set up listeners for graceful shutdown
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
        process.on(signal, async () => {
            console.log(`Received ${signal}, shutting down gracefully...`);
            server.close();
            process.exit(0);
        });
    });
}

bootstrap();