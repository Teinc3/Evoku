import { WebSocketServer } from 'ws';

import ServerSocket from '../models/ServerSocket';
import SessionManager from '../managers/SessionManager';
import RoomManager from '../managers/RoomManager';
import SystemHandler from '../handlers/system';

import type { Server as HttpServer } from 'http';


/**
 * WebSocket server class that attaches to an existing HTTP server.
 */
export default class WSServer {
  private wss: WebSocketServer;
  private sessionManager: SessionManager;
  private systemHandler: SystemHandler;
  private roomManager: RoomManager;

  constructor(
    httpServer: HttpServer,
  ) {
    // Attach the WebSocket server to the provided HTTP server instance
    this.wss = new WebSocketServer({ server: httpServer });
    this.configureWebSockets();

    // Initialize custom server services
    // Might attach more contexts in the future
    this.systemHandler = new SystemHandler();
    this.sessionManager = new SessionManager(this.systemHandler);
    this.roomManager = new RoomManager();
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