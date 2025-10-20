import { randomUUID, type UUID } from "crypto";

import ActionGuard from "@shared/types/utils/typeguards/actions";


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
  public readonly uuid: UUID;
  private disconnected: boolean;
  private authenticated: boolean;
  private authTimeout: NodeJS.Timeout | null;

  constructor(
    public socketInstance: ServerSocket | null, // Require a Socket to be initialised
    private readonly onDisconnect: (session: SessionModel) => void,
    private readonly onDestroy: (session: SessionModel) => void,
    private readonly systemHandler: IDataHandler<SystemActions>,
    public room: RoomModel | null = null,
    public lastActiveTime: number = (new Date).getTime(),
    private readonly authTimeoutMs: number = 10000 // 10 seconds by default
  ) {
    this.disconnected = false;
    this.authenticated = false;
    this.authTimeout = null;
    this.uuid = randomUUID();
    this.room = room;
    this.onDisconnect = onDisconnect.bind(this);
    this.onDestroy = onDestroy.bind(this);

    if (this.socketInstance) {
      this.socketInstance.setListener(this.dataListener.bind(this));
      this.startAuthTimeout();
    }
  }

  /**
   * Disconnects the socket from this session.
   * @param triggerEvent If the disconnect event should be triggered.
   */
  public disconnect(triggerEvent: boolean = true): void {
    this.clearAuthTimeout();
    
    if (this.socketInstance) {
      // Removes socket references
      this.socketInstance.close();
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
   */
  public destroy(triggerEvent: boolean = true): void {
    this.clearAuthTimeout();
    
    // Remove all references
    if (this.room) {
      this.room.removeSession(this);
      this.room = null;
    }
    
    if (this.socketInstance) {
      this.socketInstance.close();
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
  public reconnect(socket: ServerSocket): void {
    // Plug in the new socket
    this.socketInstance = socket;
    this.socketInstance.setListener(this.dataListener.bind(this));
    this.disconnected = false; // Reset disconnected flag
    this.startAuthTimeout();
  }

  /**
   * Marks the session as authenticated, clearing the authentication timeout.
   */
  public setAuthenticated(): void {
    this.authenticated = true;
    this.clearAuthTimeout();
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
        console.log(`Session ${this.uuid} authentication timeout`);
        this.disconnect(true);
      }
    }, this.authTimeoutMs);
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
      this.disconnect(true);
    }
  }

  /**
   * Handles incoming data for the session.
   * @param data The augmented action data.
   */
  private async handleData(data: AugmentAction<ActionEnum>): Promise<boolean> {
    if (ActionGuard.isMatchActionsData(data)) {
      // Match actions require authentication
      if (!this.authenticated) {
        console.error(`Unauthenticated session ${this.uuid} attempted match action`);
        return false;
      }
      
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