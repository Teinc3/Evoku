import { Injectable, inject } from '@angular/core';

import { APP_CONFIG } from '../config';
import WebSocketService from '../../networking/services/WebSocketService';

import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * Angular service wrapper for WebSocketService
 * Provides global access to network functionality throughout the application
 */
@Injectable({
  providedIn: 'root'
})
export default class NetworkService {
  private readonly _config = inject(APP_CONFIG);
  private wsService: WebSocketService | null = null;

  constructor() {
    this.initializeNetworkService();
  }

  /** Get the websocket service instance */
  getWSService(): WebSocketService {
    if (!this.wsService) {
      throw new Error('WebSocketService not initialized');
    }
    return this.wsService;
  }

  /** Initialize the network service with configuration */
  private initializeNetworkService(): void {
    // WebSocketService handles its own configuration internally
    this.wsService = new WebSocketService();
  }

  /** Connect to the WebSocket server */
  async connect(): Promise<void> {
    return this.getWSService().connect();
  }

  /** Disconnect from the WebSocket server */
  disconnect(code?: number, reason?: string): void {
    this.getWSService().disconnect(code, reason);
  }

  /** Send an action packet to the server */
  send<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ): void {
    this.getWSService().send(action, data);
  }

  /** Get current connection status */
  get isConnected(): boolean {
    return this.getWSService().ready;
  }
}
