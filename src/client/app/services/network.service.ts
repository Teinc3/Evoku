import { Injectable, Optional } from '@angular/core';

import WebSocketService from '../../networking/services/WebSocketService';

import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * Angular service wrapper for APIService and WebSocketService
 * Currently, only WebSocketService is implemented.
 * Provides global access to network functionality throughout the application
 */
@Injectable({ providedIn: 'root' })
export default class NetworkService {
  private readonly wsService: WebSocketService;

  constructor(@Optional() wsService?: WebSocketService) {
    this.wsService = wsService ?? new WebSocketService();
  }

  getWSService(): WebSocketService { return this.wsService; }

  /** Connect to the WebSocket server */
  async connect(): Promise<void> {
    return this.wsService.connect();
  }

  /** Disconnect from the WebSocket server */
  disconnect(code?: number, reason?: string): void {
    this.wsService.disconnect(code, reason);
  }

  /** Send an action packet to the server */
  send<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ): void {
    this.wsService.send(action, data);
  }

  /** Get current connection status */
  get isConnected(): boolean {
    return this.wsService.ready;
  }
}
