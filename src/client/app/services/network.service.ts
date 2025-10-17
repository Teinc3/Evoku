import { Injectable, Optional } from '@angular/core';

import WebSocketService from '../../networking/services/WebSocketService';

import type ActionEnum from '@shared/types/enums/actions';
import type { IGuestAuthResponse } from '@shared/types/api/auth/guest-auth';
import type ActionMap from '@shared/types/actionmap';


/**
 * Angular service wrapper for APIService and WebSocketService
 * Currently, only WebSocketService is implemented.
 * Provides global access to network functionality throughout the application
 */
@Injectable({ providedIn: 'root' })
export default class NetworkService {
  private readonly wsService: WebSocketService;
  private readonly cookieName = 'evoku_guest_token';

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

  /**
   * Get the guest token from cookies
   */
  private getGuestTokenFromCookie(): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === this.cookieName) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Save the guest token to cookies
   * Cookie is set as SameSite=Strict and Secure
   */
  private saveGuestTokenToCookie(token: string): void {
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
    document.cookie = `${this.cookieName}=${encodeURIComponent(token)}; ` +
      `max-age=${maxAge}; path=/; SameSite=Strict; ${secure}`;
  }

  /**
   * Initialize guest authentication by fetching or creating a guest token
   * Returns the guest authentication response with token and ELO
   */
  async initGuestAuth(): Promise<IGuestAuthResponse> {
    const existingToken = this.getGuestTokenFromCookie();

    // Prepare request body
    const body = existingToken ? { token: existingToken } : {};

    try {
      const headers = new Headers();
      headers.append('Content-Type', 'application/json');

      const response = await fetch('/api/auth/guest', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Guest auth failed with status ${response.status}`);
      }

      const data = await response.json() as IGuestAuthResponse;

      // Save the new token to cookies
      this.saveGuestTokenToCookie(data.token);

      return data;
    } catch (error) {
      console.error('Failed to initialize guest authentication:', error);
      throw error;
    }
  }
}
