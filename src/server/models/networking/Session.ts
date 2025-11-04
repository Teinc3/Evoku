import { randomUUID, type UUID } from "crypto";

import ActionGuard from "@shared/types/utils/typeguards/actions";
import WSCloseCode from "@shared/types/enums/ws-codes.enum";
import SessionActions from "@shared/types/enums/actions/system/session";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SystemActions from "@shared/types/enums/actions/system";
import type ActionEnum from "@shared/types/enums/actions";
import type ActionMap from "@shared/types/actionmap";
import type IDataHandler from "../../types/handler";
import type ServerSocket from "./ServerSocket";
import type RoomModel from "./Room";


/**
 * A model representing a user session in the game.
 * 
 * @param socket - The WebSocket connection for this session.
 * @readonly @optional @param uuid - Unique identifier for the session.
 * @optional @param room - The room this session is currently in.
 */
export default class SessionModel {
  private static readonly AUTH_TIMEOUT_MS = 5000; // 5 seconds
  private static readonly MAX_PRE_AUTH_QUEUE_SIZE = 20; // Maximum packets to queue before auth

  public uuid: UUID;
  private disconnected: boolean;
  private authenticated: boolean;
  private authTimeout: NodeJS.Timeout | null;
  private preAuthPacketQueue: AugmentAction<ActionEnum>[];

  constructor(
    public socketInstance: ServerSocket | null, // Require a Socket to be initialised
    private readonly onDisconnect: (session: SessionModel) => void,
    private readonly onDestroy: (session: SessionModel) => void,
    private readonly onAuthenticate: (session: SessionModel, userID: UUID) => void,
    private readonly systemHandler: IDataHandler<SystemActions>,
    public room: RoomModel | null = null,
    public lastActiveTime: number = (new Date).getTime()
  ) {
    this.disconnected = false;
    this.authenticated = false;
    this.authTimeout = null;
    this.uuid = randomUUID();
    this.room = room;
    this.onDisconnect = onDisconnect.bind(this);
    this.onDestroy = onDestroy.bind(this);
    this.onAuthenticate = onAuthenticate.bind(this);

    this.preAuthPacketQueue = [];

    if (this.socketInstance) {
      this.socketInstance.setListener(this.dataListener.bind(this));
      this.startAuthTimeout();
    }
  }

  /**
   * Disconnects the socket from this session.
   * @param triggerEvent If the disconnect event should be triggered.
   * @param code WebSocket close code (defaults to NORMAL_CLOSURE)
   * @param reason Optional reason string
   */
  public disconnect(
    triggerEvent: boolean = true,
    code: number = WSCloseCode.NORMAL_CLOSURE,
    reason?: string
  ): void {
    this.clearAuthTimeout();
    
    // Clear any queued packets
    this.preAuthPacketQueue.length = 0;
    
    if (this.socketInstance) {
      // Removes socket references
      this.socketInstance.close(code, reason);
      this.socketInstance = null;
    }

    if (triggerEvent && !this.disconnected) {
      this.disconnected = true;
      this.onDisconnect(this);
    }
  }

  /**
   * Destroys the session, cleaning up all resources.
   * @param triggerEvent If the destroy event should be triggered.
   * @param code WebSocket close code (defaults to NORMAL_CLOSURE)
   * @param reason Optional reason string
   */
  public destroy(
    triggerEvent: boolean = true,
    code: number = WSCloseCode.NORMAL_CLOSURE,
    reason?: string
  ): void {
    this.clearAuthTimeout();
    
    // Clear any queued packets
    this.preAuthPacketQueue.length = 0;
    
    // Remove all references
    if (this.room) {
      this.room.removeSession(this);
      this.room = null;
    }
    
    if (this.socketInstance) {
      this.socketInstance.close(code, reason);
      this.socketInstance = null;
    }

    if (triggerEvent) {
      this.onDestroy(this);
    }
  }

  /**
   * Sets a reconnecting socket back to this session.
   * Clears the reconnection timer and references the new socket.
   */
  public reconnect(socket: ServerSocket, packetQueue: AugmentAction<ActionEnum>[]): void {
    // Disconnect old socket, triggering events (i.e. removing from queue)
    this.disconnect();

    // Plug in the new socket.
    // We know it's valid since the socket has completed auth again.
    this.socketInstance = socket;
    this.socketInstance.setListener(this.dataListener.bind(this));
    this.disconnected = false; // Reset disconnected flag

    // Restore any queued packets
    this.preAuthPacketQueue.push(...packetQueue);

    // Now process any queued packets
    this.processQueuedPackets();
    // This will run asynchronously
    // while processing these queued packets sessionmanager kills the old session and socket
  }

  /**
   * Marks the session as authenticated, clearing the authentication timeout.
   */
  public async setAuthenticated(id: UUID): Promise<void> {
    this.authenticated = true;
    this.clearAuthTimeout();

    // Call sessionmanager to associate the new userID (and swap sockets for existing sessions)
    this.onAuthenticate(this, id);

    // Process any packets that were queued before authentication
    await this.processQueuedPackets();
  }

  /**
   * Process any packets that were received before authentication completed.
   */
  private async processQueuedPackets(): Promise<void> {
    // Process queued packets in order
    while (this.preAuthPacketQueue.length > 0) {
      const packet = this.preAuthPacketQueue.shift()!;
      // Handle the packet using the data listener routine
      await this.dataListener(packet);
    }
  }

  /**
   * Drains the pre-auth packet queue and returns all queued packets.
   * This method clears the queue and returns its contents for transfer to another session.
   */
  public drainPreAuthPacketQueue(): AugmentAction<ActionEnum>[] {
    const queue = [...this.preAuthPacketQueue];
    this.preAuthPacketQueue.length = 0;
    return queue;
  }

  /**
   * Checks if the session is authenticated.
   */
  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Starts the authentication timeout. If authentication does not occur within the timeout period,
   * the session will be disconnected.
   */
  private startAuthTimeout(): void {
    this.clearAuthTimeout();
    this.authTimeout = setTimeout(() => {
      if (!this.authenticated) {
        this.disconnect(true, WSCloseCode.AUTH_TIMEOUT);
      }
    }, SessionModel.AUTH_TIMEOUT_MS);
  }

  /**
   * Clears the authentication timeout if it exists.
   */
  private clearAuthTimeout(): void {
    if (this.authTimeout) {
      clearTimeout(this.authTimeout);
      this.authTimeout = null;
    }
  }

  /**
   * Listener for incoming data that routes the packet to appropriate handlers.
   * @param data The decoded packet data.
   */
  private async dataListener(data: AugmentAction<ActionEnum>): Promise<void> {    
    // Try to route the packet
    const result = await this.handleData(data);
    if (result) {
      // Update the last active time
      this.lastActiveTime = (new Date).getTime();
    } else {
      // Log the error and force disconnection
      console.error(`Action failed: ${data.action}`);
      this.disconnect(true, WSCloseCode.INVALID_PACKET);
    }
  }

  /**
   * Handles incoming data for the session.
   * @param data The augmented action data.
   */
  private async handleData(data: AugmentAction<ActionEnum>): Promise<boolean> {
    // If not authenticated, only allow AUTH packets or queue valid packets
    if (!this.authenticated) {
      if (data.action === SessionActions.AUTH) {
        return await this.systemHandler.handleData(
          this,
          data as AugmentAction<SystemActions>
        );
      } else {
        // Check queue size limit to prevent abuse
        if (this.preAuthPacketQueue.length >= SessionModel.MAX_PRE_AUTH_QUEUE_SIZE) {
          this.disconnect(true, WSCloseCode.AUTH_QUEUE_OVERFLOW);
          return false;
        }
        
        // Queue valid packets for processing after authentication
        // If after 5 seconds (auth timeout) the session still isn't authed
        // Then we just disconnect the session, simple and effective
        this.preAuthPacketQueue.push(data);
        return true;
      }
    }

    if (ActionGuard.isMatchActionsData(data)) {      
      if (this.room) {
        return this.room.roomDataHandler.handleData(this, data);
      } else {
        return false;
      }
    } else if (ActionGuard.isSystemActionsData(data)) {
      return await this.systemHandler.handleData(this, data);
    } else {
      return false;
    }
  }

  public forward<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ): void {
    if (this.socketInstance) {
      this.socketInstance.send(action, data);
    }
  }
}