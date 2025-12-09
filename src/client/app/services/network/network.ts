import { Observable } from 'rxjs';
import { Injectable, Optional } from '@angular/core';

import CookieService from '../cookie';
import { WebSocketService } from '../../../networking/services';
import { APIService } from '../../../networking/services';

import type ActionEnum from '@shared/types/enums/actions';
import type IGuestAuthResponse from '@shared/types/api/auth/guest-auth';
import type ActionMap from '@shared/types/actionmap';


/**
 * Angular service wrapper for APIService and WebSocketService
 * Provides global access to network functionality throughout the application
 */
@Injectable({ providedIn: 'root' })
export default class NetworkService {
  private static readonly GUEST_TOKEN_COOKIE_NAME = 'evoku_guest_token';
  private static readonly TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

  private readonly wsService: WebSocketService;
  private readonly apiService: APIService;
  private readonly cookieService: CookieService;

  constructor(
    @Optional() wsService?: WebSocketService,
    @Optional() apiService?: APIService,
    @Optional() cookieService?: CookieService
  ) {
    this.wsService = wsService ?? new WebSocketService();
    this.apiService = apiService ?? new APIService();
    this.cookieService = cookieService ?? new CookieService();
  }

  getWSService(): WebSocketService { return this.wsService; }

  /**
   * Subscribe to packets of a specific action type.
   * @param action The action to filter by
   * @returns Observable that emits only the data portion of packets matching the action
   */
  onPacket<GenericAction extends ActionEnum>(
    action: GenericAction
  ): Observable<ActionMap[GenericAction]> {
    return new Observable(observer => {
      const subscription = this.wsService.packetSubject.subscribe(packet => {
        if (packet.action === action) {
          const { action: _, ...data } = packet;
          observer.next(data as ActionMap[GenericAction]);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Subscribe to WebSocket disconnection events.
   * @returns Observable that emits when the WebSocket disconnects
   */
  onDisconnect(): Observable<void> {
    return this.wsService.onDisconnect;
  }

  /** Connect to the WebSocket server */
  async connect(): Promise<void> {
    // Ensure we have an auth token before connecting
    if (!this.cookieService.get(NetworkService.GUEST_TOKEN_COOKIE_NAME)) {
      await this.initGuestAuth();
    }
    
    const token = this.cookieService.get(NetworkService.GUEST_TOKEN_COOKIE_NAME);
    if (token) {
      this.wsService.setAuthToken(token);
    }
    
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
   * Initialize guest authentication by fetching or creating a guest token
   * Returns the guest authentication response with token and ELO
   */
  async initGuestAuth(): Promise<IGuestAuthResponse> {
    const existingToken = this.cookieService.get(NetworkService.GUEST_TOKEN_COOKIE_NAME);

    try {
      const data = await this.apiService.authenticateGuest(existingToken ?? undefined);

      // Save the new token to cookies
      this.cookieService.set(
        NetworkService.GUEST_TOKEN_COOKIE_NAME,
        data.token,
        NetworkService.TOKEN_MAX_AGE_SECONDS
      );

      return data;
    } catch (error) {
      console.error('Failed to initialize guest authentication:', error);
      throw error;
    }
  }
}
