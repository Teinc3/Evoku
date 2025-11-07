import RoomModel from "../../models/networking/Room";


export default class RoomManager {
  private rooms: Map<string, RoomModel>;
  private roomCleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.rooms = new Map();
    this.roomCleanupTimer = setInterval(
      this.cleanupRooms.bind(this),
      10 * 60 * 1000 // Cleanup every 10 minutes
    );
  }

  public createRoom(): RoomModel {
    const roomID = this.generateRoomID();
    const room = new RoomModel(roomID);
    this.rooms.set(roomID, room);
    return room;
  }

  /**
   * Generates a unique room ID.
   * The ID is a random string of 5 uppercase alphanumeric characters.
   */
  private generateRoomID(): string {
    let roomID: string;
    do {
      roomID = Math.random().toString(36).substring(2, 7).toUpperCase();
    } while (this.rooms.has(roomID));
    return roomID;
  }

  /**
   * Remove room references if they no longer have participants.
   * This is called periodically to clean up unused rooms.
   */
  private cleanupRooms(): void {
    for (const [roomID, room] of this.rooms.entries()) {
      if (room.participants.size === 0) {
        this.rooms.delete(roomID);
      }
    }
  }

  /** Returns the current number of active rooms. */
  public getActiveRoomsCount(): number {
    return this.rooms.size;
  }

  public close(): void {
    if (this.roomCleanupTimer) {
      clearInterval(this.roomCleanupTimer);
      this.roomCleanupTimer = null;
    }
    
    this.rooms.clear();
  }
}