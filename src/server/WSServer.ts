import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';
import GameSocket from './GameSocket';

import type { Server as HttpServer } from 'http';
import type { Application } from 'express';


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
    this.wss.on('connection', ws => {
      console.log('New WebSocket connection established');
      const socket = new GameSocket(ws);

      // Example: handle incoming packets
      socket.onPacket((packet) => {
        console.log('Received decoded packet:', packet);
        // You can add routing/handling logic here
      });

      socket.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });
  }

  public start() {
    this.server.listen(this.port, () => {
      console.log(`WebSocket server is running on ws://localhost:${this.port}`);
    });
  }

  public close(): void {
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
        
    this.server.close(() => {
      console.log('HTTP server closed');
    });
  }

}