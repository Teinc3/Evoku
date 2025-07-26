import { randomUUID, type UUID } from "crypto";

import { 
  isMatchActionsData, isSystemActions
} from "@shared/types/utils/typeguards/actions";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type ActionEnum from "@shared/types/enums/actions";
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

  constructor(
    public socketInstance: ServerSocket | null, // Require a Socket to be initialised
    private readonly onDisconnect: (session: SessionModel) => void,
    private readonly onDestroy: (session: SessionModel) => void,
    public readonly uuid: UUID = randomUUID(),
    public room: RoomModel | null = null,
    public lastActiveTime: number = (new Date).getTime()
  ) {
    this.uuid = uuid;
    this.room = room;
    this.onDestroy = onDestroy.bind(this);

    if (this.socketInstance) {
      this.socketInstance.listen(this.routeData.bind(this));
    }
  }

  /**
   * Disconnects the socket from this session.
   * @param triggerEvent If the disconnect event should be triggered.
   */
  public disconnect(triggerEvent: boolean = false): void {
    if (
      this.socketInstance
      && this.socketInstance.readyState === WebSocket.OPEN
    ) {
      // Removes socket references
      this.socketInstance.close();
      this.socketInstance = null;
    }

    if (!triggerEvent) {
      this.onDisconnect(this);
    }
  }

  /**
   * Destroys the session, cleaning up all resources.
   * @param triggerEvent If the destroy event should be triggered.
   */
  public destroy(triggerEvent: boolean = false): void {
    // Remove all references
    if (this.room) {
      this.room.removeSession(this);
      this.room = null;
    }
    this.socketInstance = null;

    if (!triggerEvent) {
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
    this.socketInstance.listen(this.routeData.bind(this))
  }

  /**
   * Routes incoming packet data to the appropriate handler.
   * @param data The decoded packet data.
   */
  private routeData(data: AugmentAction<ActionEnum>): void {
    // Update last active time
    this.lastActiveTime = (new Date).getTime();

    // If packet is roompacket, route to room if exists, otherwise error out
    if (isMatchActionsData(data)) {
      if (this.room) {
        this.room.roomDataHandler.handleData(this, data);
      } else {
        console.warn(`Session ${this.uuid} tried to send a system action without being in a room.`);
      }
    } else if (isSystemActions(data.action)) {
      // TODO: Forward to systemHandler
    } else {
      // Error out
      console.error(`Unknown action received: ${data.action}`);
      this.socketInstance?.close();
    }
  }

}