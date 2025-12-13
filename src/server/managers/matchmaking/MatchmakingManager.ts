import { LobbyActions } from "@shared/types/enums/actions";
import MatchmakingEntryModel from "../../models/matchmaking/MatchmakingEntry";

import type SessionManager from "../session";
import type RoomManager from "../room";
import type { SessionModel } from "../../models/networking";


/**
 * Manager for matchmaking functionality.
 * Handles player queueing, matching, and room creation.
 */
export default class MatchmakingManager {
  private pendingQueue = new Map<string, MatchmakingEntryModel>();
  private activeQueue: MatchmakingEntryModel[] = [];
  private broadcastTimer?: NodeJS.Timeout;

  constructor(
    private sessionManager: SessionManager,
    private roomManager: RoomManager
  ) {
    // Start periodic broadcasts to all authenticated sessions
    this.startPeriodicBroadcasts();
  }

  /**
   * Add a player to the matchmaking queue.
   * Player starts in pending queue for 5 seconds before becoming active.
   */
  public joinQueue(session: SessionModel, username: string): boolean {
    const sessionId = session.uuid;

    // Don't add if already in queue
    if (this.pendingQueue.has(sessionId) ||
        this.activeQueue.some(entry => entry.session.uuid === sessionId)
    ) {
      return false;
    }

    const entry = new MatchmakingEntryModel(session, username, this.sessionManager);
    // No longer start individual timers - handled by central broadcast
    this.pendingQueue.set(sessionId, entry);

    // Send initial queue update immediately when joining
    entry.sendQueueUpdate();

    // Promote to active queue after 5 seconds
    setTimeout(() => {
      this.promoteToActive(sessionId);
    }, 5000);
    return true;
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
    // No longer needed - handled by central broadcast
    this.pendingQueue.delete(sessionId);
    this.activeQueue.push(entry);

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
      { playerID: 0, username: username1, elo: session1.getElo() },
      { playerID: 1, username: username2, elo: session2.getElo() }
    ];

    session1.forward(LobbyActions.MATCH_FOUND, {
      myID: 0,
      players: playersInfo
    });

    session2.forward(LobbyActions.MATCH_FOUND, {
      myID: 1,
      players: playersInfo
    });
  }

  /** Get the current queue status for debugging/monitoring */
  public getQueueStatus(): { pending: number; active: number } {
    return {
      pending: this.pendingQueue.size,
      active: this.activeQueue.length
    };
  }

  /** Start periodic broadcasts of queue information to all authenticated sessions */
  private startPeriodicBroadcasts(): void {
    this.broadcastTimer = setInterval(() => {
      this.broadcastQueueUpdate();
    }, 15000); // Every 15 seconds
  }

  /** Stop periodic broadcasts */
  private stopPeriodicBroadcasts(): void {
    if (this.broadcastTimer) {
      clearInterval(this.broadcastTimer);
      this.broadcastTimer = undefined;
    }
  }

  /** Broadcast queue update to all sessions in queue */
  private broadcastQueueUpdate(): void {
    const onlineCount = this.sessionManager.getOnlineCount();

    // Forward to all sessions in the queue
    for (const mmEntry of [...this.pendingQueue.values(), ...this.activeQueue]) {
      mmEntry.session.forward(LobbyActions.QUEUE_UPDATE, {
        inQueue: true,
        onlineCount
      });
    }
  }

  /** Clean up all timers and clear queues */
  public close(): void {
    this.stopPeriodicBroadcasts();
    
    // Clear all pending queue timers
    for (const entry of this.pendingQueue.values()) {
      entry.destroy();
    }
    this.pendingQueue.clear();
    this.activeQueue.length = 0;
  }
}
