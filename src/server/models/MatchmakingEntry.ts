import LobbyActions from "@shared/types/enums/actions/system/lobby";

import type SessionManager from "../managers/session/SessionManager";
import type SessionModel from "./networking/Session";


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

  /** Clean up resources */
  public destroy(): void {
    // No cleanup needed - timers are handled centrally
  }
}
