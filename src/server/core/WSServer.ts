import { WebSocketServer } from 'ws';

import statsService, { type StatsService } from '../services/stats/StatsService';
import OnlineSampler from '../services/sampler/OnlineSampler';
import { SessionManager, RoomManager, MatchmakingManager } from '../managers';
import SystemHandler from '../handlers/system';

import type { Server as HttpServer } from 'http';


/**
 * WebSocket server class that attaches to an existing HTTP server.
 */
export default class WSServer {
  private wss: WebSocketServer;
  public readonly sessionManager: SessionManager;
  public readonly roomManager: RoomManager;
  public readonly matchmakingManager: MatchmakingManager;
  private systemHandler: SystemHandler;
  private statsService: StatsService;
  private statsSampler: OnlineSampler;

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
    this.matchmakingManager = new MatchmakingManager(this.sessionManager, this.roomManager);
    this.statsService = statsService;
    statsService.initialize(this.sessionManager, this.roomManager);
    this.statsSampler = new OnlineSampler(this.statsService);
    
    // Wire up matchmaking manager to handlers and session manager
    this.systemHandler.setMatchmakingManager(this.matchmakingManager);
    this.sessionManager.setMatchmakingManager(this.matchmakingManager);

    this.statsSampler.start();
  }

  private configureWebSockets(): void {
    this.wss.on('connection', ws => {
      ws.binaryType = 'arraybuffer';
      this.sessionManager.createSession(ws);
    });
  }

  public close(): void {
    this.wss.close(() => {
      console.log('WebSocket server closed');
    });

    this.statsSampler.stop();
    this.matchmakingManager.close();
    this.roomManager.close();
    this.sessionManager.close();
  }
}
