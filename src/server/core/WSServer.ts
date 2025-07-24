import { WebSocketServer } from 'ws';

import ServerSocket from '../models/ServerSocket';

import type { Server as HttpServer } from 'http';


/**
 * WebSocket server class that attaches to an existing HTTP server.
 */
export default class WSServer {
  private wss: WebSocketServer;

  constructor(httpServer: HttpServer) {
    // Attach the WebSocket server to the provided HTTP server instance
    this.wss = new WebSocketServer({ server: httpServer });
    this.configureWebSockets();
  }

  private configureWebSockets(): void {
    this.wss.on('connection', ws => {
      const socket = new ServerSocket(ws, data => {
        console.log('Received packet:', data);
      });

      socket.onPacket(packet => {
        console.log('Received decoded packet:', packet);
      });

      socket.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });
  }

  public close(): void {
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
}