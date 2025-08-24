/**
 * Manages pending ping timestamps for PONG validation security.
 * Prevents replay attacks and manages cleanup of old pings.
 */
export default class PendingPingStore {
  private pendingPings = new Map<number, number[]>();

  static readonly MAX_PENDING_PINGS = 10;

  /** Add a pending ping timestamp for validation */
  public addPendingPing(playerID: number, serverTime: number): void {
    let pending = this.pendingPings.get(playerID);
    if (!pending) {
      pending = [];
      this.pendingPings.set(playerID, pending);
    }

    // Add new ping timestamp
    pending.push(serverTime);

    // Enforce maximum pending size (drop oldest) to prevent memory exhaustion
    // This also serves as a circuit breaker for laggy connections
    while (pending.length > PendingPingStore.MAX_PENDING_PINGS) {
      pending.shift();
    }
  }

  /** Check if player can receive new pings (not at limit) */
  public canReceivePing(playerID: number): boolean {
    const pending = this.pendingPings.get(playerID);
    return !pending || pending.length < PendingPingStore.MAX_PENDING_PINGS;
  }

  /** Validate and consume a pending ping timestamp */
  public validateAndConsumePing(playerID: number, serverTime: number): boolean {
    const pending = this.pendingPings.get(playerID);
    if (!pending) {
      return false; // No pending pings for this player
    }

    const index = pending.indexOf(serverTime);
    if (index === -1) {
      return false; // Server time not found in pending pings
    }

    pending.splice(index, 1);
    return true;
  }

  /** Get the last unconsumed ping for a player */
  public getLastPingTime(playerID: number): number | undefined {
    const pending = this.pendingPings.get(playerID);
    if (!pending || pending.length === 0) {
      return undefined; // No pending pings for this player
    }
    return pending.at(-1);
  }

  /** Remove all pending pings for a player */
  public removePlayer(playerID: number): void {
    this.pendingPings.delete(playerID);
  }

  /** Clear all pending pings */
  public clear(): void {
    this.pendingPings.clear();
  }
}
