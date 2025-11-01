import path from 'node:path';
import fs from 'node:fs';
import { createServer } from 'http';
import { rateLimit } from 'express-rate-limit';
import express from 'express';

import StatsService from '../services/StatsService';
import guestAuthService from '../services/GuestAuthService';

import type { Server as HttpServer } from 'http';
import type { Application } from 'express';
import type IGuestAuthResponse from '@shared/types/api/auth/guest-auth';
import type { StatsRange } from '../types/stats/online';
import type WSServer from './WSServer';


/**
 * Manages the Express application and the underlying HTTP server for REST API and health checks.
 */
export default class HTTPServer {
  public readonly app: Application;
  public readonly server: HttpServer;
  private readonly port: number;
  private statsService: StatsService | null = null;

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);

    this.configureRoutes();
  }

  public setWsServer(wsServer: WSServer): void {
    this.statsService = new StatsService(wsServer.sessionManager, wsServer.roomManager);
  }

  private configureRoutes(): void {
    // Middleware to parse JSON bodies
    this.app.use(express.json());

    this.configureAPI();
    this.serveClient();
  }

  /** Serve the built Angular client if it exists */
  private serveClient(): void {
    const clientDist = path.join(process.cwd(), 'dist', 'Evoku', 'browser');
    const clientIndex = path.join(clientDist, 'index.html');

    if (!fs.existsSync(clientIndex)) {
      console.warn(
        `Warning: Client build not found at ${clientIndex}. Server will not serve the application.`
      );
      return
    }

    console.log(`Serving client build from ${clientDist}`);

    // Serve static files from angular build
    // The user can choose to access the built (static) client or the development client
    // by navigating to the appropriate port (e.g., 3713 for dev server, 8745 for this server)
    this.app.use(express.static(clientDist));

    // Route everything back to index.html, client routing should fetch 404 if invalid
    this.app.use((_req, res) => {
      res.sendFile(clientIndex);
    });
  }

  /** Configure API routes */
  private configureAPI(): void {
    // Rate limiter for stats endpoints
    const statsLimiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 60, // Limit each IP to 60 requests per minute
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests, please try again later' },
    });

    // Health check endpoint
    this.app.get('/api/health', (_req, res) => {
      res.sendStatus(200);
    });

    // Guest authentication endpoint
    this.app.post('/api/auth/guest', async (req, res) => {
      try {
        const token = req.body.token as string | undefined;
        const result: IGuestAuthResponse = await guestAuthService.authenticate(token);
        res.json(result);
      } catch (error) {
        console.error('Error in guest auth endpoint:', error);
        res.sendStatus(500);
      }
    });

    // Server stats endpoint
    this.app.get('/api/stats', statsLimiter, async (req, res) => {
      try {
        if (!this.statsService) {
          res.sendStatus(500);
          return;
        }

        const range = req.query['range'] as StatsRange | undefined;

        if (range) {
          // Return historical data
          const data = await this.statsService.getHistoricalStats(range);
          res.json(data);
        } else {
          // Return current stats
          const stats = this.statsService.getCurrentStats();
          res.json(stats);
        }
      } catch (error) {
        console.error('Error in stats endpoint:', error);
        res.sendStatus(500);
      }
    });

    // Placeholder for other API routes
    this.app.all(['/api', '/api/*route'], (_req, res) => {
      res.sendStatus(501);
    });
  }

  /** Start the HTTP server */
  public async start() {
    this.server.listen(this.port, () => {
      console.log(`HTTP server is running on http://localhost:${this.port}`);
    });
  }

  /** Close the HTTP server */
  public async close() {
    this.server.close(() => {
      console.log('HTTP server closed');
    });
  }
}