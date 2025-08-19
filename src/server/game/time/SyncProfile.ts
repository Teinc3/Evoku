import type { PlayerTimeData } from "../../types/time";


/**
 * Manages time synchronization data for a single player session.
 * Handles offset calculation, RTT tracking, and client-server time conversion.
 */
export default class SyncProfile {
  private data: PlayerTimeData;

  static readonly PING_SAMPLE_SIZE = 5;

  constructor(initialServerTime: number) {
    this.data = {
      offset: 0,
      rtt: 0,
      offsetSamples: [],
      initialOffset: 0,
      initialClientTime: 0,
      initialServerTime,
      lastUpdated: initialServerTime
    };
  }

  /** Update synchronization data with new ping response */
  public updateFromPong(
    offset: number,
    rtt: number,
    clientTime: number,
    serverTime: number
  ): void {
    // Seed initial sync if not set yet
    if (this.data.initialClientTime === 0) {
      this.data.initialClientTime = clientTime;
      this.data.initialServerTime = serverTime;
      this.data.initialOffset = offset;
    }

    // Maintain samples for median filtering
    this.data.offsetSamples.push(offset);
    if (this.data.offsetSamples.length > SyncProfile.PING_SAMPLE_SIZE) {
      this.data.offsetSamples.shift();
    }

    // Calculate median offset to reduce noise
    const sorted = [...this.data.offsetSamples].sort((a, b) => a - b);
    const medianOffset = sorted[Math.floor(sorted.length / 2)];

    this.data.offset = medianOffset;
    this.data.rtt = rtt;
    this.data.lastUpdated = serverTime;
  }

  /** Convert client time to server time */
  public clientToServerTime(clientTime: number): number {
    return clientTime - this.data.offset;
  }

  /** Convert server time to client time */
  public serverToClientTime(serverTime: number): number {
    return serverTime + this.data.offset;
  }

  /** Calculate cumulative drift from initial synchronization */
  public calculateCumulativeDrift(currentClientTime: number, currentServerTime: number): number {
    if (this.data.initialClientTime === 0) {
      return 0; // No initial sync established yet
    }

    const clientElapsed = currentClientTime - this.data.initialClientTime;
    const serverElapsed = currentServerTime - this.data.initialServerTime;
    
    return clientElapsed - serverElapsed;
  }

  /** Get current RTT */
  public getRtt(): number {
    return this.data.rtt;
  }

  /** Check if initial sync has been established */
  public hasInitialSync(): boolean {
    return this.data.initialClientTime > 0;
  }

  /** Get the underlying data (for compatibility) */
  public getData(): PlayerTimeData {
    return this.data;
  }
}
