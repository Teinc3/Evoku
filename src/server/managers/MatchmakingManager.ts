import LobbyActions from "@shared/types/enums/actions/system/lobby";
import MatchmakingEntryModel from "../models/MatchmakingEntry";

import type SessionModel from "../models/networking/Session";
import type SessionManager from "./SessionManager";
import type RoomManager from "./RoomManager";


/**
 * Manager for matchmaking functionality.
 * Handles player queueing, matching, and room creation.
 */
export default class MatchmakingManager {
  private pendingQueue = new Map<string, MatchmakingEntryModel>();
  private activeQueue: MatchmakingEntryModel[] = [];

  constructor(
    private sessionManager: SessionManager,
    private roomManager: RoomManager
  ) {}

  /**
   * Add a player to the matchmaking queue.
   * Player starts in pending queue for 5 seconds before becoming active.
   */
  public joinQueue(session: SessionModel, username: string): void {
    const sessionId = session.uuid;

    // Don't add if already in queue
    if (this.pendingQueue.has(sessionId) ||
        this.activeQueue.some(entry => entry.session.uuid === sessionId)) {
      return;
    }

    const entry = new MatchmakingEntryModel(session, username, this.sessionManager);
    entry.startUpdates();
    this.pendingQueue.set(sessionId, entry);

    // Send initial queue update
    entry.sendQueueUpdate();

    // Promote to active queue after 5 seconds
    setTimeout(() => {
      this.promoteToActive(sessionId);
    }, 5000);
  }

  /** Remove a player from the matchmaking queue */
  public leaveQueue(sessionId: string): void {
    // Remove from pending queue
    const pendingEntry = this.pendingQueue.get(sessionId);
    if (pendingEntry) {
      pendingEntry.destroy();
      this.pendingQueue.delete(sessionId);
      return;
    }

    // Remove from active queue
    const activeIndex = this.activeQueue.findIndex(entry => entry.session.uuid === sessionId);
    if (activeIndex !== -1) {
      this.activeQueue.splice(activeIndex, 1);
    }
  }

  /** Handle session disconnection - ensure player is removed from queue */
  public onSessionDisconnect(sessionId: string): void {
    this.leaveQueue(sessionId);
  }

  /** Promote a player from pending to active queue and attempt matching */
  private promoteToActive(sessionId: string): void {
    const entry = this.pendingQueue.get(sessionId);
    if (!entry) {
      return; // Player may have left queue
    }

    // Stop updates since they're now active
    entry.stopUpdates();

    this.pendingQueue.delete(sessionId);
    this.activeQueue.push(entry);

    console.log(`Player ${entry.username} promoted to active queue.`);

    // Try to match players
    this.tryMatchPlayers();
  }

  private tryMatchPlayers(): void {
    if (this.activeQueue.length < 2) {
      return;
    }

    // Get first 2 players from active queue
    const player1 = this.activeQueue.shift()!;
    const player2 = this.activeQueue.shift()!;

    // Get their sessions and usernames
    const session1 = player1.session;
    const session2 = player2.session;
    const username1 = player1.username;
    const username2 = player2.username;

    // Create a room for the match
    const room = this.roomManager.createRoom();

    // Add players to room
    room.addPlayers([session1, session2]);

    // Send MATCH_FOUND packets
    const playersInfo = [
      { playerID: 0, username: username1 },
      { playerID: 1, username: username2 }
    ];

    session1.forward(LobbyActions.MATCH_FOUND, {
      myID: 0,
      players: playersInfo
    });

    session2.forward(LobbyActions.MATCH_FOUND, {
      myID: 1,
      players: playersInfo
    });

    console.log("matched players:", username1, "and", username2);
  }

  /** Get the current queue status for debugging/monitoring */
  public getQueueStatus(): { pending: number; active: number } {
    return {
      pending: this.pendingQueue.size,
      active: this.activeQueue.length
    };
  }

  /** Clean up all timers and clear queues */
  public close(): void {
    // Clear all pending queue timers
    for (const entry of this.pendingQueue.values()) {
      entry.destroy();
    }
    this.pendingQueue.clear();
    this.activeQueue.length = 0;
  }
}
