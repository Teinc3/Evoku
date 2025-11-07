import ActionValidator from "./validator";
import SyncProfile from "./syncprofile";
import PendingPingStore from "./pingstore";
import PingCoordinator from "./pingcoordinator";

import type { PlayerActions } from "@shared/types/enums/actions";
import type { RoomModel } from "../../models/networking";


/**
 * TimeCoordinator synchronises time between server and player sessions,
 * providing robust validation against timing exploits
 * while maintaining smooth gameplay.
 * 
 * This is a coordinating facade that delegates to specialized components:
 * - SyncProfile: Per-player time synchronization data
 * - PendingPingStore: PONG validation security
 * - PingCoordinator: Ping scheduling and sending
 * - ActionValidator: Timing validation and action history
 */
export default class TimeCoordinator {
  // Exported constants for use in Tests
  static readonly MAX_ACTION_HISTORY_COUNT = ActionValidator.MAX_ACTION_HISTORY_COUNT;
  static readonly PING_INTERVAL = PingCoordinator.PING_INTERVAL;
  static readonly MIN_PING_INTERVAL = PingCoordinator.MIN_PING_INTERVAL;
  static readonly MAX_PENDING_PINGS = PendingPingStore.MAX_PENDING_PINGS;

  private syncProfiles = new Map<number, SyncProfile>();
  private pendingPings = new PendingPingStore();
  private pingCoordinator: PingCoordinator;
  private actionValidator = new ActionValidator();
  private hasInitialised: boolean;
  private startTimeMs: number | undefined;

  constructor(room: RoomModel) {
    this.hasInitialised = false;
    this.pingCoordinator = new PingCoordinator(
      room,
      this.syncProfiles,
      this.pendingPings,
      () => this.getServerTime(),
      () => this.hasInitialised
    );
  }

  /** Get monotonic server time (starts from 0 at game initialization) */
  private getServerTime(): number {
    if (this.startTimeMs === undefined) {
      throw new Error("TimeCoordinator has not has not been initialized. Call start() first.");
    }
    return Math.floor(globalThis.performance.now()) - this.startTimeMs;
  }

  /** Mark game as initialized and start ping service for existing player sessions */
  public start(): void {
    this.hasInitialised = true;
    this.startTimeMs = Math.floor(globalThis.performance.now()); 
    this.pingCoordinator.startPingService();
  }

  /** Handle PONG response from player and update time synchronization data */
  public handlePong(playerID: number, clientTime: number, originalServerTime: number): void {
    // Validate that this serverTime was actually sent by us
    if (!this.pendingPings.validateAndConsumePing(playerID, originalServerTime)) {
      console.warn(`Player ${playerID} sent PONG with invalid serverTime: ${originalServerTime}`);
      return;
    }

    const now = this.getServerTime();
    const roundTripTime = now - originalServerTime;
    
    // Calculate one-way delay and offset
    const oneWayDelay = roundTripTime / 2;
    const offset = clientTime - (originalServerTime + oneWayDelay);
    
    // Update the sync profile
    const syncProfile = this.syncProfiles.get(playerID);
    if (syncProfile) {
      syncProfile.updateFromPong(offset, roundTripTime, clientTime, now);
    }
  }

  /** Estimate serverTime for a given clientTime, clamped to be per-player monotonic */
  public estimateServerTime(playerID: number, clientTime: number): number {
    const syncProfile = this.syncProfiles.get(playerID);
    return this.actionValidator.estimateServerTime(
      playerID,
      clientTime,
      syncProfile,
      this.getServerTime()
    );
  }

  /** 
   * Sync-only checks (no gameplay cooldowns) + serverTime estimate.
   * @returns Estimated server time if valid (>= 0), or TimeValidationReason if invalid
   */
  public assessTiming(playerID: number, clientTime: number): number {
    const now = this.getServerTime();
    const syncProfile = this.syncProfiles.get(playerID);
    
    return this.actionValidator.assessTiming(
      playerID,
      clientTime,
      now,
      syncProfile,
      now
    );
  }

  /**
   * Commits the action time after successful validation and logic processing.
   * @returns The current server time for broadcasting.
   */
  public updateLastActionTime(playerID: number, action: PlayerActions, clientTime: number): number {
    const now = this.getServerTime();
    return this.actionValidator.updateLastActionTime(playerID, action, clientTime, now);
  }

  /** Get the current ping (RTT) for a player */
  public getPlayerPing(playerID: number): number {
    const syncProfile = this.syncProfiles.get(playerID);
    return syncProfile?.getRtt() || 0;
  }

  /** Convert client time to server time for a specific player (for testing) */
  public clientToServerTime(playerID: number, clientTime: number): number {
    const syncProfile = this.syncProfiles.get(playerID);
    return syncProfile?.clientToServerTime(clientTime) || clientTime;
  }

  /** Convert server time to client time for a specific player (for testing) */
  public serverToClientTime(playerID: number, serverTime: number): number {
    const syncProfile = this.syncProfiles.get(playerID);
    return syncProfile?.serverToClientTime(serverTime) || serverTime;
  }

  /** Add a new player session to the time service */
  public addPlayerSession(playerID: number): void {
    if (this.syncProfiles.has(playerID)) {
      console.warn(`Player session ${playerID} already exists in time service.`);
      return;
    }

    // Use current server time if initialized, otherwise use 0 as placeholder
    const now = this.startTimeMs !== undefined ? this.getServerTime() : 0;
    this.syncProfiles.set(playerID, new SyncProfile(now));

    // Send immediate ping if game is already initialized
    if (this.hasInitialised) {
      this.pingCoordinator.sendImmediatePing(playerID);
    }
  }

  /** Clean up player session data when a session is removed */
  public removePlayerSession(playerID: number): void {
    this.syncProfiles.delete(playerID);
    this.actionValidator.removePlayer(playerID);
    this.pendingPings.removePlayer(playerID);
  }

  /** Stop the ping service and clean up */
  public close(): void {
    this.pingCoordinator.stop();
    this.syncProfiles.clear();
    this.actionValidator.clear();
    this.pendingPings.clear();
  }
}
