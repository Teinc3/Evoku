import type { PingContract, PongContract } from '@shared/types/contracts';


/**
 * Client-side TimeCoordinator for synchronizing client and server times.
 * Provides estimated server time for accurate cooldown calculations and timing validations.
 */
export default class ClientTimeCoordinator {

  /** Forward offset between client and server clocks, without RTT compensation */
  private syncOffset: number;
  /** Latest RTT measurement */
  private rtt: number;

  constructor() {
    this.syncOffset = 0;
    this.rtt = 0;
  }

  /** Accured time since local client timecoordinator service startup. */
  public get clientTime(): number {
    return performance.now();
  }

  /** Returns a best-guess estimate for the current serverTime */
  public get serverTime(): number {
    return this.estimateServerTime(this.clientTime);
  }

  /**
   * Handle incoming ping from server and respond with pong.
   * @param ping Ping packet from server
   * @param sendPong Callback to send the pong packet
   */
  public handlePing(ping: PingContract, sendPong: (packet: PongContract) => void): void {    
    const pongPacket: PongContract = {
      clientTime: this.clientTime,
      serverTime: ping.serverTime
    };
    sendPong(pongPacket);

    this.updateSync(this.clientTime - ping.serverTime, ping.clientPing);
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
   * Get estimated server time for the given client time, compensating for latency.
   * @param clientTime Client timestamp to convert
   * @returns Estimated server time
   */
  public estimateServerTime(clientTime: number): number {
    const latency = this.rtt / 2;
    return clientTime - this.syncOffset + latency;
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
