import SessionModel from "../models/networking/Session";

import type { UUID } from "crypto";
import type SystemActions from "@shared/types/enums/actions/system";
import type IDataHandler from "../types/handler";
import type ServerSocket from "../models/networking/ServerSocket";


/**
 * A global Session manager that handles all user sessions in game.
 */
export default class SessionManager {
  private sessions: Map<UUID, SessionModel>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor (private systemHandler: IDataHandler<SystemActions>) {
    this.sessions = new Map();

    // Start the cleanup interval
    this.cleanupInterval = setInterval(
      this.cleanupSessions.bind(this),
      10 * 1000
    ); // Check every 10 seconds
  }

  public createSession(socket: ServerSocket): SessionModel {
    const session = new SessionModel(
      socket,
      session => this.onDisconnect(session),
      session => this.onDestroy(session),
      this.systemHandler
    );
    this.sessions.set(session.uuid, session);
    return session;
  }

  public getSession(uuid: UUID): SessionModel | undefined {
    return this.sessions.get(uuid);
  }

  /** Returns the current number of online sessions. */
  public getOnlineCount(): number {
    return this.sessions.size;
  }

  /**
   * Event handler when the socket of a session disconnects.
   * @param session The session which socket disconnected.
   */
  public onDisconnect(_session: SessionModel): void {
    // TODO: Add sth here (idk what to add lol)
  }

  /**
   * Event handler when a session is destroyed.
   * @param session The session that was destroyed.
   */
  public onDestroy(session: SessionModel): void {
    this.sessions.delete(session.uuid);
  }

  /**
   * Cleanup function to remove sessions that are no longer active.
   * 
   * Criteria for cleanup:
   * - 30 seconds of socket inactivity: Socket closure and disconnection
   * - 2 minutes of session inactivity: Session is permanently removed.
   */
  private cleanupSessions(): void {
    const now = (new Date).getTime();
    for (const session of this.sessions.values()) {
      // Check if the session is inactive for more than 2 minutes
      const lastActive = session.lastActiveTime;
      const inactiveDuration = now - lastActive;

      if (inactiveDuration > 2 * 60 * 1000) { // 2 minutes
        session.destroy(true);
      } else if (inactiveDuration > 30 * 1000 && session.socketInstance) {
        session.disconnect(true);
      }
    }
  }

  public close(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Close all sessions
    for (const session of this.sessions.values()) {
      session.destroy(true);
    }
    this.sessions.clear();
  }
}