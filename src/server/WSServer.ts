import express, { Application } from 'express';
import { createServer, Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';


/**
 * WebSocket server class that handles purely WebSocket connections.
 */
export default class WSServer {

    private app: Application;
    private server: HttpServer;
    private wss: WebSocketServer;
    private readonly port: number;

    constructor(port: number) {
        this.port = port;
        this.app = express();
        this.server = createServer(this.app);
        this.wss = new WebSocketServer({ server: this.server });

        this.configureWebSockets();
    }

    private configureWebSockets(): void {
        this.wss.on('connection', (ws) => {
            console.log('New WebSocket connection established');

            ws.on('message', (message) => {
                console.log(`Received message: ${message}`);
            });

            ws.on('close', () => {
                console.log('WebSocket connection closed');
            });
        });
    }

    public start() {
        this.server.listen(this.port, () => {
            console.log(`WebSocket server is running on ws://localhost:${this.port}`);
        });
    }
    
}