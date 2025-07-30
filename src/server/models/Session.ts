import { randomUUID, type UUID } from "crypto";

import { 
  isMatchActionsData, isSystemActionsData
} from "@shared/types/utils/typeguards/actions";


import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SystemActions from "@shared/types/enums/actions/system";
import type ActionEnum from "@shared/types/enums/actions";
import type ActionMap from "@shared/types/actionmap";
import type IDataHandler from "../types/handler";
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

  constructor(
    public socketInstance: ServerSocket | null, // Require a Socket to be initialised
    private readonly onDisconnect: (session: SessionModel) => void,
    private readonly onDestroy: (session: SessionModel) => void,
    private readonly systemHandler: IDataHandler<SystemActions>,
    public room: RoomModel | null = null,
    public lastActiveTime: number = (new Date).getTime()
  ) {
    this.uuid = randomUUID();
    this.room = room;
    this.onDestroy = onDestroy.bind(this);

    if (this.socketInstance) {
      this.socketInstance.setListener(this.dataListener.bind(this));
    }
  }

  /**
   * Disconnects the socket from this session.
   * @param triggerEvent If the disconnect event should be triggered.
   */
  public disconnect(triggerEvent: boolean = true): void {
    if (this.socketInstance) {
      // Removes socket references
      this.socketInstance.close();
      this.socketInstance = null;
    }

    if (triggerEvent) {
      this.onDisconnect(this);
    }
  }

  /**
   * Destroys the session, cleaning up all resources.
   * @param triggerEvent If the destroy event should be triggered.
   */
  public destroy(triggerEvent: boolean = true): void {
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
    this.socketInstance.setListener(this.dataListener.bind(this))
  }

  /**
   * Listener for incoming data that routes the packet to appropriate handlers.
   * @param data The decoded packet data.
   */
  private dataListener(data: AugmentAction<ActionEnum>): void {    
    // Try to route the packet
    if (this.handleData(data)) {
      // Update the last active time
      this.lastActiveTime = (new Date).getTime();
    } else {
      // Error out and force disconnection
      console.error(`Action failed: ${data.action}`);
      this.disconnect(true);
    }
  }

  /**
   * Handles incoming data for the session.
   * @param data The augmented action data.
   */
  private handleData(data: AugmentAction<ActionEnum>): boolean {
    if (isMatchActionsData(data)) {
      if (this.room) {
        return this.room.roomDataHandler.handleData(this, data);
      } else {
        return false;
      }
    } else if (isSystemActionsData(data)) {
      return this.systemHandler.handleData(this, data);
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