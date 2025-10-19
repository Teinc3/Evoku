import path from 'node:path';
import fs from 'node:fs';
import { createServer } from 'http';
import express from 'express';

import redisService from '../services/RedisService';
import guestAuthService from '../services/GuestAuthService';

import type { Server as HttpServer } from 'http';
import type { Application } from 'express';
import type IGuestAuthResponse from '@shared/types/api/auth/guest-auth';


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

    this.app.get('/api/health', (_req, res) => {
      res.sendStatus(200);
    });

    this.app.get('/api*', (_req, res) => {
      res.sendStatus(501);
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

    // Serve the built Angular client only if a build exists
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

  public async start() {
    this.server.listen(this.port, () => {
      console.log(`HTTP server is running on http://localhost:${this.port}`);
      redisService.setStartupTime(); // Log startup time in Redis after initialization

    });
  }

  public async close() {
    this.server.close(() => {
      console.log('HTTP server closed');
    });
  }
}