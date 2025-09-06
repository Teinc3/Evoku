import ProtocolActions from '@shared/types/enums/actions/match/protocol';
import clientConfig from '@config/client.json' with { type: 'json' };
import ClientSocket from '../transport/ClientSocket';
import ClientPacketHandler from '../handlers/ClientPacketHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * High-level network service that manages connection policy, action routing,
 * heartbeat/latency, offline send queue, and auto-reconnection.
 * Built on top of the transport-only ClientSocket.
 */
export default class NetworkService {
  private socket: ClientSocket;
  private packetHandler: ClientPacketHandler;
  private queue: Array<[ActionEnum, ActionMap[ActionEnum]]>;
  private reconnectTimer: ReturnType<typeof setTimeout> | null;
  private pingTimer: ReturnType<typeof setInterval> | null;
  public lastPingAt: number | null;
  public latencyMs: number | null;

  constructor() {
    this.socket = new ClientSocket();
    this.packetHandler = new ClientPacketHandler(this);

    this.queue = [];
    this.reconnectTimer = null;
    this.pingTimer = null;
    this.lastPingAt = null;
    this.latencyMs = null;
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
    this.flushQueue();
    this.startHeartbeat();
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(code?: number, reason?: string): void {
    this.clearTimers();
    this.socket.close(code, reason);
  }

  /* Packet handling is now managed through the composite handler architecture.
     The ClientPacketHandler automatically routes packets to the appropriate
     system or match handlers based on action type. No manual subscription
     is needed - handlers are always active and filter relevant packets. */

  /**
   * Get the packet handler instance for direct access to handlers
   */
  getPacketHandler(): ClientPacketHandler {
    return this.packetHandler;
  }

  /**
   * Send an action packet to the server
   */
  send<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ): void {
    if (!this.ready) {
      this.queue.push([action, data]);
      return;
    }

    try {
      this.socket.send(action, data);
    } catch (error) {
      // If send fails, add back to queue for retry
      this.queue.push([action, data]);
      throw error;
    }
  }

  /**
   * Cleanup all listeners and timers
   */
  destroy(): void {
    this.clearTimers();
    this.queue.length = 0;
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
  };

  private handleError = (error: Event): void => {
    console.error('WebSocket error:', error);
  };

  private flushQueue(): void {
    if (!this.ready) {
      return;
    }

    for (const [action, data] of this.queue) {
      try {
        this.socket.send(action, data);
      } catch (error) {
        console.error(`Failed to send queued action ${String(action)}:`, error);
        // Keep remaining items in queue for next flush attempt
        break;
      }
    }
    this.queue.length = 0;
  }

  private startHeartbeat(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }

    this.pingTimer = setInterval(() => {
      if (!this.ready) {
        return;
      }

      try {
        this.lastPingAt = Date.now();
        this.send(ProtocolActions.PING, {} as ActionMap[typeof ProtocolActions.PING]);
      } catch (error) {
        console.error('Failed to send ping:', error);
      }
    }, clientConfig.networking.service.pingIntervalMs);
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
