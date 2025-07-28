import RoomModel from "../models/Room";


export default class RoomManager {
  private rooms: Map<string, RoomModel>;

  constructor() {
    this.rooms = new Map();
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
}