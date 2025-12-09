import { Subject, Observable } from 'rxjs';

import { SessionActions } from '@shared/types/enums/actions';
import sharedConfig from '@shared/config';
import ClientSocket from '../../transport';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * High-level network service that manages connection policy, action routing,
 * and heartbeat/latency.
 * Built on top of the transport-only ClientSocket.
 */
export default class WebSocketService {
  private socket: ClientSocket;
  readonly packetSubject = new Subject<AugmentAction<ActionEnum>>();
  private disconnectSubject = new Subject<void>();
  private pingTimer: ReturnType<typeof setInterval> | null;
  public lastPingAt: number | null;
  private lastPacketSentAt: number;
  private disconnectCallback: ((code: number, reason: string) => void) | null = null;
  private authToken: string | null = null;

  constructor(socket?: ClientSocket) {
    this.socket = socket || new ClientSocket();

    this.pingTimer = null;
    this.lastPingAt = null;
    this.lastPacketSentAt = 0;
  }

  /**
   * Set the authentication token to use for connecting
   */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  /** Whether the socket is ready for communication */
  get ready(): boolean {
    return this.socket.isOpen;
  }

  /** Observable that emits when the WebSocket disconnects */
  get onDisconnect(): Observable<void> {
    return this.disconnectSubject.asObservable();
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    await this.socket.connect();
    this.socket.setListener(data => {
      console.debug('Packet received from server:', data);
      
      const latency = sharedConfig.networking.ws.simulatedLatencyMs;
      if (latency > 0) {
        setTimeout(() => {
          this.packetSubject.next(data);
        }, latency);
      } else {
        this.packetSubject.next(data);
      }
    });
    this.socket.onClose(this.handleClose);
    this.socket.onError(this.handleError);
    
    // Send AUTH packet immediately after connection
    if (this.authToken) {
      this.send(SessionActions.AUTH, {
        token: this.authToken,
        version: sharedConfig.version,
      });
    }
    
    this.startHeartbeat();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(code?: number, reason?: string): void {
    this.clearTimers();
    this.socket.close(code, reason);
  }

  /**
   * Set a callback to be called when the socket disconnects
   */
  setDisconnectCallback(callback: (code: number, reason: string) => void): void {
    this.disconnectCallback = callback;
  }

  /**
   * Send an action packet to the server
   */
  send<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ): void {
    if (!this.ready) {
      throw new Error('WebSocket is not connected');
    }

    const latency = sharedConfig.networking.ws.simulatedLatencyMs;
    const sendPacket = () => {
      try {
        this.socket.send(action, data);
        this.lastPacketSentAt = Date.now();
      } catch (error) {
        throw error;
      }
    };

    if (latency > 0) {
      setTimeout(sendPacket, latency);
    } else {
      sendPacket();
    }
  }

  /**
   * Cleanup all listeners and timers
   */
  destroy(): void {
    this.clearTimers();
    this.packetSubject.complete();
    this.disconnectSubject.complete();
    this.socket.close();
  }

  // Private methods

  private handleClose = (event: CloseEvent): void => {
    this.clearTimers();

    // Notify any listeners about the disconnect
    if (this.disconnectCallback) {
      this.disconnectCallback(event.code, event.reason);
    }

    // Emit disconnect event
    this.disconnectSubject.next();
  };

  private handleError = (error: Event): void => {
    console.error('WebSocket error:', error);
  };

  private startHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.pingTimer = setInterval(() => {
      if (!this.ready) {
        return;
      }

      const now = Date.now();
      const timeSinceLastPacket = now - this.lastPacketSentAt;

      // Send HEARTBEAT if it's been 15 seconds since last packet
      if (timeSinceLastPacket >= 15 * 1000) {
        try {
          this.lastPingAt = now;
          this.send(SessionActions.HEARTBEAT, {});
        } catch (error) {
          console.error('Failed to send heartbeat:', error);
        }
      }
    }, 5000); // Check every 5 seconds
  }

  private clearTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    this.lastPingAt = null;
  }
}
