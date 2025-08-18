import ProtocolActions from "@shared/types/enums/actions/match/protocol";

import type SyncProfile from "../../models/networking/SyncProfile";
import type RoomModel from "../../models/networking/Room";
import type PendingPingStore from "./PendingPingStore";


/**
 * Coordinates ping scheduling and sending for time synchronization.
 * Manages the global ping interval and immediate pings for reconnections.
 */
export default class PingCoordinator {
  private globalPingInterval: NodeJS.Timeout | null;

  static readonly PING_INTERVAL = 2000; // ms
  static readonly MIN_PING_INTERVAL = 500; // ms

  constructor(
    private readonly room: RoomModel,
    private readonly syncProfiles: Map<number, SyncProfile>,
    private readonly pendingPings: PendingPingStore,
    private readonly getServerTime: () => number,
    private readonly isGameInitialised: () => boolean
  ) {
    this.globalPingInterval = null;
  }

  /** Start the global ping service */
  public startPingService(): void {
    if (!this.globalPingInterval) {
      // Send one immediate pass so existing sessions get a PING right after init
      this.performGlobalPing();

      this.globalPingInterval = setInterval(() => {
        this.performGlobalPing();
      }, PingCoordinator.PING_INTERVAL);
    }
  }

  /** Send immediate ping to a specific player (for reconnections) */
  public sendImmediatePing(playerID: number): void {
    if (!this.isGameInitialised()) {
      return; // Don't send pings before game initialization
    }

    // Immediate ping is only for reconnection purposes or is forced (probably by AC)
    // So we don't enforce ping store limit
    const now = this.getServerTime();
    this.sendPingToPlayer(playerID, now);
  }

  /** Stop the ping service */
  public stop(): void {
    if (this.globalPingInterval) {
      clearInterval(this.globalPingInterval);
      this.globalPingInterval = null;
    }
  }

  /** Perform ping for all active player sessions */
  private performGlobalPing(): void {
    const currentServerTime = this.getServerTime();
    
    for (const playerID of this.syncProfiles.keys()) {
      // Circuit breaker: don't send if player has too many pending pings (laggy connection)
      if (!this.pendingPings.canReceivePing(playerID)) {
        continue; // Skip this player - they're likely experiencing lag
      }

      // Don't send if we sent a ping to this player very recently
      const lastPing = this.pendingPings.getLastPingTime(playerID);
      if (lastPing && currentServerTime - lastPing < PingCoordinator.MIN_PING_INTERVAL) {
        continue;
      }

      this.sendPingToPlayer(playerID, currentServerTime);
    }
  }

  /** Send a ping to a specific player */
  private sendPingToPlayer(playerID: number, serverTime: number): void {
    // Find the session for this player using the reverse lookup
    const sessionUUID = this.room.getSessionIDFromPlayerID(playerID);
    if (!sessionUUID) {
      return;
    }

    const session = this.room.participants.get(sessionUUID);
    if (!session) {
      return;
    }

    // Track this ping for PONG validation
    this.pendingPings.addPendingPing(playerID, serverTime);

    // Get current RTT for this player
    const syncProfile = this.syncProfiles.get(playerID);
    const clientPing = syncProfile?.getRtt() ?? 0;

    session.forward(ProtocolActions.PING, {
      serverTime,
      clientPing
    });
  }
}