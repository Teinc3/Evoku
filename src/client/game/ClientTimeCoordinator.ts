import type { PingContract, PongContract } from '@shared/types/contracts';


/**
 * Client-side TimeCoordinator for synchronizing client and server times.
 * 
 * Time Synchronization Strategy:
 * 1. Client operates in its own local time (performance.now) for smooth UI and immediate feedback.
 * 2. Server validates actions using the Client's timestamp to prevent false rejections due to lag.
 * 3. Server enforces a maximum allowable drift between Client and Server clocks.
 * 4. When Server broadcasts an action, it includes the Server Time of that action.
 *    - If we initiated the action (found in pending queue), we use our original Client Time.
 *    - If another player initiated it, we convert Server Time -> Client Time for approximation.
 */
export default class ClientTimeCoordinator {

  /** Forward offset between client and server clocks, without RTT compensation */
  private syncOffset: number;
  /** Latest RTT measurement */
  private rtt: number;
  /** Relative time of game initialisation */
  public startTime: number | null;

  constructor() {
    this.syncOffset = 0;
    this.rtt = 0;
    this.startTime = null;
  }

  /** Accrued time since local client timecoordinator service startup. */
  public get clientTime(): number {
    return performance.now();
  }

  /** Elapsed time since game start, or 0 if not started yet. */
  public get timeElapsed(): number {
    if (this.startTime === null) {
      return 0;
    }

    return this.clientTime - this.startTime;
  }

  public onGameInit(): void {
    this.startTime = this.clientTime;
  }

  /**
   * Handle incoming ping from server and respond with pong.
   * @param ping Ping packet from server
   * @param sendPong Callback to send the pong packet
   */
  public handlePing(ping: PingContract, sendPong: (packet: PongContract) => void): void {
    const clientTime = this.clientTime;
    const pongPacket: PongContract = {
      clientTime,
      serverTime: ping.serverTime
    };
    sendPong(pongPacket);

    // Calculate True Offset: Client - Server - Latency
    // This aligns with Server's SyncProfile logic
    const latency = ping.clientPing / 2;
    this.updateSync(clientTime - ping.serverTime - latency, ping.clientPing);
  }

  /**
   * Update time synchronization based on server-provided offset and RTT.
   * This method should be called when the server sends timing information.
   * @param offset Current offset between client and server clocks
   * @param rtt Round-trip time measurement
   */
  public updateSync(offset: number, rtt: number): void {
    this.syncOffset = offset;
    this.rtt = rtt;
  }

  /**
   * Get estimated client time for the given server time.
   * @param serverTime Server timestamp to convert
   * @returns Estimated client time
   */
  public estimateClientTime(serverTime: number): number {
    return serverTime + this.syncOffset;
  }

  /**
   * Reset synchronization state (e.g., on each session reconnection)
   * 
   * Note that clientTime doesn't have to be reset
   * as we perform an initial syncronisation to gap the relative differences.
   */
  public reset(): void {
    this.syncOffset = 0;
    this.rtt = 0;
  }
}
