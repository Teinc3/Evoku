import { randomUUID, type UUID } from "crypto";

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
    public socket: ServerSocket | null, // Require a Socket to be initialised
    private readonly onDestroy: () => void,
    public readonly uuid: UUID = randomUUID(),
    // Optional account info, when the user authenticates using token or in game
    // private accountInfo: AccountInfo | null = null,
    public room: RoomModel | null = null,
    private reconnectionTimer: NodeJS.Timeout | null = null
  ) {
    this.uuid = uuid;
    this.room = room;
    this.onDestroy = onDestroy.bind(this);
  }

  /**
     * Handler when the socket of this session disconnects.
     * Creates a 2 minute reconnection timer, after which,
     * the session is permanently removed from the server.
     */
  public onDisconnect(): void {
    this.socket = null; // Clear the socket reference
    this.reconnectionTimer = setTimeout(() => {
      this.destroy(); // Destroy the session first
    }, 2 * 60 * 1000);
  }

  /**
     * Handler when the socket of this session reconnects.
     * Clears the reconnection timer and references the new socket.
     */
  public onReconnect(socket: ServerSocket): void {
    // Plug in the new socket
    this.socket = socket;

    // Clear the reconnection timer if it exists
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
  }

  public destroy(calledFromManager: boolean = false): void {
    // Clear the reconnection timer if it exists
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }

    // Remove all references
    if (this.room) {
      this.room.removeSession(this);
      this.room = null;
    }
    this.socket = null;

    // If called from the SessionManager, do not call onDestroy
    if (!calledFromManager) {
      this.onDestroy();
    }
  }

}