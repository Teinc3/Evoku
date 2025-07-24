import SessionModel from "../models/Session";

import type { UUID } from "crypto";
import type ServerSocket from "../models/ServerSocket";


/**
 * A global Session manager that handles all user sessions in game.
 */
export default class SessionManager {
  constructor (
    private sessions: Map<UUID, SessionModel> = new Map()
  ) {}

  public createSession(socket: ServerSocket): SessionModel {
    const session = new SessionModel(
      socket,
      () => this.removeSession(session.uuid)
    );
    this.sessions.set(session.uuid, session);
    return session;
  }

  public getSession(uuid: UUID): SessionModel | undefined {
    return this.sessions.get(uuid);
  }

  public removeSession(uuid: UUID): void {
    const session = this.sessions.get(uuid);
    if (session) {
      session.destroy(true);
      this.sessions.delete(uuid);
    }
  }
}