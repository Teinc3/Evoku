import SessionActions from '@shared/types/enums/actions/system/session';
import clientConfig from '@config/client.json' with { type: 'json' };
import ClientSocket from '../transport/ClientSocket';
import ClientPacketHandler from '../handlers/ClientPacketHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * High-level network service that manages connection policy, action routing,
 * heartbeat/latency, and auto-reconnection.
 * Built on top of the transport-only ClientSocket.
 */
export default class WebSocketService {
  private socket: ClientSocket;
  private packetHandler: ClientPacketHandler;
  private reconnectTimer: ReturnType<typeof setTimeout> | null;
  private pingTimer: ReturnType<typeof setInterval> | null;
  public lastPingAt: number | null;
  private lastPacketSentAt: number;
  private disconnectCallback: (() => void) | null = null;

  constructor(socket?: ClientSocket, packetHandler?: ClientPacketHandler) {
    this.socket = socket || new ClientSocket();
    this.packetHandler = packetHandler || new ClientPacketHandler(this);

    this.reconnectTimer = null;
    this.pingTimer = null;
    this.lastPingAt = null;
    this.lastPacketSentAt = 0;
  }

  /**
   * Whether the socket is ready for communication
   */
  get ready(): boolean {
    return this.socket.isOpen;
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    await this.socket.connect();
    this.socket.setListener(this.handlePacket);
    this.socket.onClose(this.handleClose);
    this.socket.onError(this.handleError);
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
  setDisconnectCallback(callback: () => void): void {
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

    try {
      this.socket.send(action, data);
      this.lastPacketSentAt = Date.now();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cleanup all listeners and timers
   */
  destroy(): void {
    this.clearTimers();
    this.socket.close();
  }

  // Private methods

  private handlePacket = (augmentedAction: AugmentAction<ActionEnum>): void => {
    const { action } = augmentedAction;

    // Dispatch to composite handler architecture
    try {
      this.packetHandler.handleData(augmentedAction);
    } catch (error) {
      console.error(`Error in packet handler for action ${String(action)}:`, error);
    }
  };

  private handleClose = (): void => {
    this.clearTimers();

    if (clientConfig.networking.service.autoReconnect) {
      this.scheduleReconnect();
    }

    // Notify any listeners about the disconnect
    if (this.disconnectCallback) {
      this.disconnectCallback();
    }
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

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    let delay = clientConfig.networking.service.backoffMs;

    const attempt = async (): Promise<void> => {
      try {
        await this.connect();
        console.log('Reconnected to server');
      } catch (error) {
        console.error('Reconnection failed:', error);
        delay = Math.min(delay * 2, clientConfig.networking.service.backoffMaxMs);
        this.reconnectTimer = setTimeout(attempt, delay);
      }
    };

    this.reconnectTimer = setTimeout(attempt, delay);
  }

  private clearTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.lastPingAt = null;
  }
}
