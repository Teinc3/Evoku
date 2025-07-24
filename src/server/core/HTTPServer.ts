import { createServer } from 'http';
import express from 'express';

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
    // Add a basic health check route for the HTTP server
    this.app.get('/health', (req, res) => {
      res.status(200).send('OK');
    });
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`HTTP server is running on http://localhost:${this.port}`);
    });
  }

  public close(): void {
    this.server.close(() => {
      console.log('HTTP server closed');
    });
  }
}