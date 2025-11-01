import path from 'node:path';
import fs from 'node:fs';
import { createServer } from 'http';
import express from 'express';
import { rateLimit } from 'express-rate-limit';

import redisService from '../services/RedisService';
import guestAuthService from '../services/GuestAuthService';

import type { Server as HttpServer } from 'http';
import type { Application, Request, Response, NextFunction } from 'express';
import type IGuestAuthResponse from '@shared/types/api/auth/guest-auth';
import type { IOnlineStats, IOnlineDataPoint, OnlineStatsRange, OnlineStatsFormat } 
  from '../types/stats/online';


/**
 * Manages the Express application and the underlying HTTP server for REST API and health checks.
 */
export default class HTTPServer {
  public readonly app: Application;
  public readonly server: HttpServer;
  private readonly port: number;

  constructor(port: number) {
    this.port = port;
    this.app = express();
    this.server = createServer(this.app);

    this.configureRoutes();
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
    // Middleware for API key authentication
    const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
      const apiKey = req.headers['x-api-key'];
      const expectedKey = process.env['API_KEY'];

      if (!expectedKey) {
        // In dev mode, allow if no API key is set
        if (process.env['NODE_ENV'] === 'development') {
          return next();
        }
        return res.status(500).json({ error: 'API key not configured' });
      }

      if (apiKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      next();
    };

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
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Current online count endpoint
    this.app.get('/api/stats/online', apiKeyAuth, statsLimiter, async (req, res) => {
      try {
        const range = req.query['range'] as OnlineStatsRange | undefined;
        const format = (req.query['format'] as OnlineStatsFormat) || 'text';

        // If range is provided, return historical data
        if (range) {
          const data = await this.getHistoricalOnlineStats(range);

          if (format === 'json') {
            res.json(data);
          } else {
            // Return as text (CSV format)
            const csv = data
              .map(point => `${new Date(point.at).toISOString()},${point.online}`)
              .join('\n');
            res.type('text/plain').send(csv);
          }
        } else {
          // Return current count
          const currentData = await this.getCurrentOnlineStats();
          res.json(currentData);
        }
      } catch (error) {
        console.error('Error in online stats endpoint:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Placeholder for other API routes
    this.app.all(['/api', '/api/*route'], (_req, res) => {
      res.sendStatus(501);
    });
  }

  /** Get current online count from Redis */
  private async getCurrentOnlineStats(): Promise<IOnlineStats> {
    const now = Date.now();
    // Get the most recent entry from the sorted set
    const results = await redisService.zRangeByScoreWithScores(
      'stats:online',
      now - 60_000, // Last minute
      now
    );

    if (results.length === 0) {
      return { online: 0, at: now };
    }

    // Get the most recent entry
    const latest = results[results.length - 1];
    return {
      online: parseInt(latest.value, 10),
      at: latest.score,
    };
  }

  /** Get historical online stats from Redis */
  private async getHistoricalOnlineStats(range: OnlineStatsRange): Promise<IOnlineDataPoint[]> {
    const now = Date.now();
    let startTime: number;

    switch (range) {
      case '1h':
        startTime = now - 60 * 60 * 1000;
        break;
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        startTime = now - 60 * 60 * 1000;
    }

    const results = await redisService.zRangeByScoreWithScores(
      'stats:online',
      startTime,
      now
    );

    return results.map(result => ({
      at: result.score,
      online: parseInt(result.value, 10),
    }));
  }

  /** Start the HTTP server */
  public async start() {
    this.server.listen(this.port, () => {
      console.log(`HTTP server is running on http://localhost:${this.port}`);
      redisService.setStartupTime(); // Log startup time in Redis after initialization
    });
  }

  /** Close the HTTP server */
  public async close() {
    this.server.close(() => {
      console.log('HTTP server closed');
    });
  }
}