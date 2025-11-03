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
  private updateTimer?: NodeJS.Timeout;
  private sessionManager: SessionManager;

  constructor(session: SessionModel, username: string, sessionManager: SessionManager) {
    this.session = session;
    this.username = username;
    this.joinTime = Date.now();
    this.sessionManager = sessionManager;
  }

  /** Start sending queue updates every 15 seconds */
  public startUpdates(): void {
    this.updateTimer = setInterval(() => {
      this.sendQueueUpdate();
    }, 15000);
  }

  /** Stop sending queue updates. */
  public stopUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = undefined;
    }
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
    this.stopUpdates();
  }
}
