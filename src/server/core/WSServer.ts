import { WebSocketServer } from 'ws';

import ServerSocket from '../models/ServerSocket';
import SessionManager from '../managers/SessionManager';

import type { Server as HttpServer } from 'http';


/**
 * WebSocket server class that attaches to an existing HTTP server.
 */
export default class WSServer {
  private wss: WebSocketServer;

  constructor(
    httpServer: HttpServer,
    private sessionManager: SessionManager = new SessionManager()
  ) {
    // Attach the WebSocket server to the provided HTTP server instance
    this.wss = new WebSocketServer({ server: httpServer });
    this.configureWebSockets();
  }

  private configureWebSockets(): void {
    this.wss.on('connection', ws => {
      // Create a new ServerSocket instance and a SessionModel that wraps it
      const socket = new ServerSocket(ws);
      this.sessionManager.createSession(socket);
    });
  }

  public close(): void {
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });
  }
}