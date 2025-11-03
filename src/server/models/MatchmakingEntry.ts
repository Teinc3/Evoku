import LobbyActions from "@shared/types/enums/actions/system/lobby";

import type SessionModel from "./networking/Session";
import type SessionManager from "../managers/SessionManager";


/**
 * Represents a player's entry in the matchmaking queue.
 * Handles queue update timers and session management.
 */
export default class MatchmakingEntryModel {
  public readonly session: SessionModel;
  public readonly username: string;
  public readonly joinTime: number;
  private sessionManager: SessionManager;

  constructor(session: SessionModel, username: string, sessionManager: SessionManager) {
    this.session = session;
    this.username = username;
    this.joinTime = Date.now();
    this.sessionManager = sessionManager;
  }

  /** Send a queue update packet to the session */
  public sendQueueUpdate(): void {
    const onlineCount = this.sessionManager.getOnlineCount();
    this.session.forward(LobbyActions.QUEUE_UPDATE, {
      inQueue: true,
      onlineCount
    });
  }

  /** Check if the entry has been in pending queue for 5+ seconds */
  public isReadyForActive(): boolean {
    return Date.now() - this.joinTime >= 5000;
  }

  /** Clean up resources */
  public destroy(): void {
    // No cleanup needed - timers are handled centrally
  }
}
