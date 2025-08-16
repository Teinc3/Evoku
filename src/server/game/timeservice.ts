import { performance } from "node:perf_hooks";

import ProtocolActions from "@shared/types/enums/actions/match/protocol";
import TimeValidationReason from "../types/enums/timevalidation";

import type { PlayerActionData, PlayerTimeData } from "src/server/types/time";
import type PlayerActions from "@shared/types/enums/actions/match/player";
import type RoomModel from "../models/networking/Room";


/**
 * TimeService manages time synchronization between server and player sessions.
 * 
 * Provides robust validation against timing exploits while maintaining smooth gameplay.
 */
export default class TimeService {
  // Configuration constants

  static readonly MAX_ACTION_HISTORY_COUNT = 30;
  static readonly PING_INTERVAL = 2000; // ms
  static readonly PING_SAMPLE_SIZE = 5;
  /** Maximum number of pending pings to track per player */
  static readonly MAX_PENDING_PINGS = 10;
  /** Maximum total drift allowed over match lifecycle */
  static readonly MAX_CUMULATIVE_DRIFT = 50; // ms
  /** Maximum age of pending pings (older pings are discarded) */
  static readonly MAX_PING_AGE = 10000; // 10 seconds
  /** Minimum interval between pings to same player to avoid simultaneous checks */
  static readonly MIN_PING_INTERVAL = 500; // ms
  /** Maximum number of actions allowed within the interval */
  static readonly MIN_ACTION_INTERVAL = {
    actions: 5,
    interval: 500
  }

  /** Time synchronisation data for each player session */
  private playerData = new Map<number, PlayerTimeData>();
  /** Stores last action times for each unique action of every player session */
  private playerActions = new Map<number, PlayerActionData[]>();
  /** Global, unified ping interval for all sessions */
  private globalPingInterval: NodeJS.Timeout | null = null;
  /** Pending ping timestamps per player session for PONG validation */
  private pendingPings = new Map<number, number[]>();
  /** Whether the game has been initialized and ping service can start */
  private gameInitialized = false;
  
  /** Game start time for monotonic server timer */
  private readonly startTimeMs: number;

  constructor(private readonly room: RoomModel) {
    this.startTimeMs = performance.now();
  }

  /** Get monotonic server time (starts from 0 at game initialization) */
  private getServerTime(): number {
    return performance.now() - this.startTimeMs; // strictly monotonic
  }

  /** Mark game as initialized and start ping service for existing player sessions */
  public startPingService(): void {
    if (this.gameInitialized) {
      console.warn("Ping service already started, ignoring duplicate call.");
      return;
    }
    this.gameInitialized = true;
    
    // Start global ping interval
    if (!this.globalPingInterval) {
      // Send one immediate pass so existing sessions get a PING right after init
      this.performGlobalPing();

      this.globalPingInterval = setInterval(() => {
        this.performGlobalPing();
      }, TimeService.PING_INTERVAL);
    }
  }

  /** Send a ping to a specific player (used by both global and immediate ping) */
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
    this.addPendingPing(playerID, serverTime);

    session.forward(ProtocolActions.PING, {
      serverTime,
      clientPing: this.playerData.get(playerID)?.rtt ?? 0
    });
  }

  /** Perform ping for all active player sessions */
  private performGlobalPing(): void {
    const now = this.getServerTime();
    
    for (const playerID of this.playerData.keys()) {
      const playerData = this.playerData.get(playerID);
      if (!playerData) {
        continue;
      }
      
      // Check if we sent a ping to this player recently (avoid simultaneous pings)
      const lastPingTime = this.pendingPings.get(playerID)?.at(-1);
      if (lastPingTime && now - lastPingTime < TimeService.MIN_PING_INTERVAL) {
        continue;
      }

      this.sendPingToPlayer(playerID, now);
    }
  }

  /** Add a pending ping timestamp for PONG validation */
  private addPendingPing(playerID: number, serverTime: number): void {
    let pending = this.pendingPings.get(playerID);
    if (!pending) {
      pending = [];
      this.pendingPings.set(playerID, pending);
    }

    // Add new ping timestamp
    pending.push(serverTime);

    // Clean up old pings by age (from oldest to newest)
    const now = this.getServerTime();
    // Use while + shift to avoid iterator + splice pitfalls
    while (pending.length > 0 && (now - pending[0]) > TimeService.MAX_PING_AGE) {
      pending.shift();
    }

    // Enforce maximum pending size (drop oldest)
    while (pending.length > TimeService.MAX_PENDING_PINGS) {
      pending.shift();
    }
  }

  /** Validate and consume a pending ping timestamp */
  private validateAndConsumePing(playerID: number, serverTime: number): boolean {
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

  /** Handle PONG response from player and update time synchronization data */
  public handlePong(playerID: number, clientTime: number, originalServerTime: number): void {
    // Validate that this serverTime was actually sent by us
    if (!this.validateAndConsumePing(playerID, originalServerTime)) {
      console.warn(`Player ${playerID} sent PONG with invalid serverTime: ${originalServerTime}`);
      return; // Manipulated PONG packets
    }

    const now = this.getServerTime();
    const roundTripTime = now - originalServerTime;
    
    // Calculate one-way delay and offset
    const oneWayDelay = roundTripTime / 2;
    const offset = clientTime - (originalServerTime + oneWayDelay);
    
    this.updatePlayerTimeData(playerID, offset, roundTripTime, clientTime, now);
  }

  /** Estimate serverTime for a given clientTime, clamped to be per-player monotonic */
  public estimateServerTime(playerID: number, clientTime: number): number {
    const playerData = this.playerData.get(playerID);
    const estimated = playerData
      ? this.clientToServerTime(playerID, clientTime)
      : this.getServerTime();
    
    // Use the last committed action's server time as the monotonic baseline
    const actionHistory = this.playerActions.get(playerID);
    const lastActionServerTime = actionHistory && actionHistory.length > 0 
      ? actionHistory[actionHistory.length - 1].serverTime 
      : 0;
    
    return Math.max(estimated, lastActionServerTime, 0);
  }

  /** 
   * Sync-only checks (no gameplay cooldowns) + serverTime estimate.
   * @returns Estimated server time if valid (>= 0), or TimeValidationReason if invalid
   */
  public assessTiming(
    playerID: number,
    clientTime: number
  ): number {
    const now = this.getServerTime();
    const playerData = this.playerData.get(playerID);
    if (!playerData) {
      return TimeValidationReason.NO_SYNC_PROFILE;
    }

    const actionHistory = this.playerActions.get(playerID) || [];

    if (actionHistory.length > 0) {
      // 1. Monotonic increase (any action type)
      const lastAction = actionHistory[actionHistory.length - 1];
      if (clientTime <= lastAction.clientTime) {
        return TimeValidationReason.MONOTONIC_VIOLATION;
      }

      // 2. Anti-spam: last 5 actions must not all be within 500ms (server time)
      const recentWindow = actionHistory
        .slice(-TimeService.MIN_ACTION_INTERVAL.actions)
        .filter(a => a.serverTime >= now - TimeService.MIN_ACTION_INTERVAL.interval);
      if (recentWindow.length >= TimeService.MIN_ACTION_INTERVAL.actions) {
        return TimeValidationReason.RATE_LIMIT;
      }

      // 3. Cumulative drift: only after first sync (PONG) established
      if (playerData.initialClientTime > 0) {
        const newCumulativeDrift = this.calculateCumulativeDrift(playerData, clientTime, now);
        if (Math.abs(newCumulativeDrift) > TimeService.MAX_CUMULATIVE_DRIFT) {
          return TimeValidationReason.DRIFT_EXCEEDED;
        }
      }
    }

    return this.estimateServerTime(playerID, clientTime);
  }

  /**
   * Commits the action time after successful validation and logic processing.
   * @returns The current server time for broadcasting.
   */
  public updateLastActionTime(playerID: number, action: PlayerActions, clientTime: number): number {
    const now = this.getServerTime();
    
    // Get or create action history for this player
    let actionHistory = this.playerActions.get(playerID);
    if (!actionHistory) {
      actionHistory = [];
      this.playerActions.set(playerID, actionHistory);
    }
    
    // Add new action to history
    actionHistory.push({
      action,
      clientTime,
      serverTime: now
    });
    
    // Keep only recent actions (e.g., last 30)
    if (actionHistory.length > TimeService.MAX_ACTION_HISTORY_COUNT) {
      actionHistory.splice(0, actionHistory.length - TimeService.MAX_ACTION_HISTORY_COUNT);
    }
    
    return now;
  }

  /** Get the current ping (RTT) for a player */
  public getPlayerPing(playerID: number): number {
    const playerData = this.playerData.get(playerID);
    return playerData?.rtt || 0;
  }

  /** Convert client time to server time for a specific player */
  private clientToServerTime(playerID: number, clientTime: number): number {
    const playerData = this.playerData.get(playerID);
    if (!playerData) {
      return clientTime; // Fallback if no sync data
    }
    
    return clientTime - playerData.offset;
  }

  /** Convert server time to client time for a specific player */
  private serverToClientTime(playerID: number, serverTime: number): number {
    const playerData = this.playerData.get(playerID);
    if (!playerData) return serverTime; // Fallback if no sync data
    
    return serverTime + playerData.offset;
  }

  /** Add a new player session to the time service */
  public addPlayerSession(playerID: number): void {
    if (this.playerData.has(playerID)) {
      console.warn(`Player session ${playerID} already exists in time service.`);
      return; // Player session already exists
    }
    const now = this.getServerTime();
    this.playerData.set(playerID, {
      offset: 0,
      rtt: 0,
      offsetSamples: [],
      initialOffset: 0,
      initialClientTime: 0,
      initialServerTime: now,
      lastUpdated: now
    });
    this.playerActions.set(playerID, []);

    // If game is already initialized, send immediate ping for reconnecting players
    if (this.gameInitialized) {
      this.sendImmediatePing(playerID);
    }
  }

  /** Send immediate ping to a specific player (for reconnections) */
  private sendImmediatePing(playerID: number): void {
    const now = this.getServerTime();
    this.sendPingToPlayer(playerID, now);
  }

  /** Clean up player session data when a session is removed */
  public removePlayerSession(playerID: number): void {
    this.playerData.delete(playerID);
    this.playerActions.delete(playerID);
    this.pendingPings.delete(playerID);
  }

  /** Stop the ping service and clean up */
  public close(): void {
    // Clear global ping interval
    if (this.globalPingInterval) {
      clearInterval(this.globalPingInterval);
      this.globalPingInterval = null;
    }
    this.playerData.clear();
    this.playerActions.clear();
    this.pendingPings.clear();
    this.gameInitialized = false;
  }

  /** Update player time synchronization data with median filtering */
  private updatePlayerTimeData(
    playerID: number,
    offset: number,
    rtt: number,
    clientTime: number,
    serverTime: number
  ): void {
    let playerData = this.playerData.get(playerID);

    if (!playerData) {
      playerData = {
        offset,
        rtt,
        offsetSamples: [offset],
        initialOffset: offset,
        initialClientTime: clientTime,
        initialServerTime: serverTime,
        lastUpdated: serverTime
      };
    } else {
      // Seed initial sync if not set yet (we pre-create records in addPlayerSession)
      if (playerData.initialClientTime === 0) {
        playerData.initialClientTime = clientTime;
        playerData.initialServerTime = serverTime;
        playerData.initialOffset = offset;
      }

      // Maintain samples (median)
      playerData.offsetSamples.push(offset);
      if (playerData.offsetSamples.length > TimeService.PING_SAMPLE_SIZE) {
        playerData.offsetSamples.shift();
      }
      const sorted = [...playerData.offsetSamples].sort((a, b) => a - b);
      const medianOffset = sorted[Math.floor(sorted.length / 2)];

      playerData.offset = medianOffset;
      playerData.rtt = rtt;
      playerData.lastUpdated = serverTime;
    }

    this.playerData.set(playerID, playerData);
  }

  /** Calculate cumulative drift from initial synchronization */
  private calculateCumulativeDrift(
    playerData: PlayerTimeData,
    currentClientTime: number,
    currentServerTime: number
  ): number {
    // Calculate how much time has elapsed in each domain
    const clientElapsed = currentClientTime - playerData.initialClientTime;
    const serverElapsed = currentServerTime - playerData.initialServerTime;
    
    // Cumulative drift is the difference between these elapsed times
    return clientElapsed - serverElapsed;
  }
}