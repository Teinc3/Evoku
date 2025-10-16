import path from 'node:path';
import fs from 'node:fs';
import { createServer } from 'http';
import express from 'express';

import redisService from '../services/RedisService';

import type { Server as HttpServer } from 'http';
import type { Application } from 'express';


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

    this.app.get('/health', (_req, res) => {
      res.sendStatus(200);
    });

    this.app.get('/api', (_req, res) => {
      res.sendStatus(501);
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

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`HTTP server is running on http://localhost:${this.port}`);
      redisService.setStartupTime(); // Log startup time in Redis after initialization

    });
  }

  public close(): void {
    this.server.close(() => {
      console.log('HTTP server closed');
    });
  }
}