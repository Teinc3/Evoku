import { performance } from "node:perf_hooks";

import ProtocolActions from "@shared/types/enums/actions/match/protocol";

import type { PlayerActionData, PlayerTimeData } from "src/server/types/time";
import type PlayerActions from "@shared/types/enums/actions/match/player";
import type RoomModel from "../../models/networking/Room";


/**
 * TimeService manages time synchronization between server and players.
 * 
 * Provides robust validation against timing exploits while maintaining smooth gameplay.
 */
export default class TimeService {
  // Configuration constants
  /** Maximum total drift allowed over match lifecycle */
  static readonly MAX_CUMULATIVE_DRIFT = 50; // ms
  static readonly MAX_ACTION_HISTORY_COUNT = 30;
  static readonly PING_INTERVAL = 2000; // ms
  static readonly PING_SAMPLE_SIZE = 5;
  /** Maximum number of actions allowed within the interval */
  static readonly MIN_ACTION_INTERVAL = {
    actions: 5,
    interval: 500
  }

  /** Time synchronisation data for each player */
  private playerData = new Map<number, PlayerTimeData>();
  /** Stores last action times for each unique action of every player */
  private playerActions = new Map<number, PlayerActionData[]>();
  private pingInterval: NodeJS.Timeout | null = null;
  
  /** Game start time for monotonic server timer */
  private readonly startTimeMs: number;

  constructor(private readonly room: RoomModel) {
    this.startTimeMs = performance.now();
  }

  /** Get monotonic server time (starts from 0 at game initialization) */
  private getServerTime(): number {
    return performance.now() - this.startTimeMs; // strictly monotonic
  }

  /** Start sending periodic ping packets to all clients */
  public startPingService(): void {
    if (this.pingInterval) {
      return;
    }
    
    this.pingInterval = setInterval(() => {
      const serverTime = this.getServerTime();
      // TODO: Make clientPing distinct per player
      this.room.broadcast(ProtocolActions.PING, {
        serverTime,
        clientPing: 0
      });
    }, TimeService.PING_INTERVAL);
  }

  /** Handle PONG response from player and update time synchronization data */
  public handlePong(playerID: number, clientTime: number, originalServerTime: number): void {
    const now = this.getServerTime();
    const roundTripTime = now - originalServerTime;
    
    // Calculate one-way delay and offset
    const oneWayDelay = roundTripTime / 2;
    const offset = clientTime - (originalServerTime + oneWayDelay);
    
    this.updatePlayerTimeData(playerID, offset, roundTripTime, clientTime, now);
  }

  /** Validate timing for a player action without committing the state */
  public validateActionTiming(
    playerID: number,
    action: PlayerActions,
    clientTime: number,
    cooldownMs: number
  ): boolean {
    const now = this.getServerTime();

    const playerData = this.playerData.get(playerID);
    if (!playerData) {
      console.log(`No sync data for player ${playerID}`);
      return false;
    }

    const actionHistory = this.playerActions.get(playerID) || [];

    if (actionHistory.length > 0) {
      // 1. Monotonic increase (any action type)
      const lastAction = actionHistory[actionHistory.length - 1];
      if (clientTime <= lastAction.clientTime) {
        console.log(`Non-monotonic clientTime: ${clientTime} <= ${lastAction.clientTime}`);
        return false;
      }

      // 2. Action-specific cooldown
      const lastActionOfType = actionHistory.slice().reverse().find(a => a.action === action);
      if (lastActionOfType) {
        const clientTimeDelta = clientTime - lastActionOfType.clientTime;
        if (clientTimeDelta < cooldownMs) {
          console.log(`Cooldown violation for ${action}: ${clientTimeDelta} < ${cooldownMs}`);
          return false;
        }
      }

      // 3. Anti-spam: last 5 actions must not all be within 500ms (server time)
      const recentWindow = actionHistory
        .slice(-TimeService.MIN_ACTION_INTERVAL.actions)
        .filter(a => a.serverTime >= now - TimeService.MIN_ACTION_INTERVAL.interval);
      if (recentWindow.length >= TimeService.MIN_ACTION_INTERVAL.actions) {
        console.log(`Rate limiting: ${recentWindow.length} actions`
          + ` within ${TimeService.MIN_ACTION_INTERVAL.interval}ms`);
        return false;
      }

      // 4. Cumulative drift: only after first sync (PONG) established
      if (playerData.initialClientTime > 0) {
        const newCumulativeDrift = this.calculateCumulativeDrift(playerData, clientTime, now);
        if (Math.abs(newCumulativeDrift) > TimeService.MAX_CUMULATIVE_DRIFT) {
          console.log(`Cumulative drift exceeded: ${Math.abs(newCumulativeDrift)}`
            + ` > ${TimeService.MAX_CUMULATIVE_DRIFT}`);
          return false;
        }
      }
    }

    return true;
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
  public clientToServerTime(playerID: number, clientTime: number): number {
    const playerData = this.playerData.get(playerID);
    if (!playerData) return clientTime; // Fallback if no sync data
    
    return clientTime - playerData.offset;
  }

  /** Convert server time to client time for a specific player */
  public serverToClientTime(playerID: number, serverTime: number): number {
    const playerData = this.playerData.get(playerID);
    if (!playerData) return serverTime; // Fallback if no sync data
    
    return serverTime + playerData.offset;
  }

  /** Add a new player to the time service */
  public addPlayer(playerID: number): void {
    if (this.playerData.has(playerID)) {
      console.warn(`Player ${playerID} already exists in time service.`);
      return; // Player already exists
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
  }

  /** Clean up player data when a player is removed */
  public removePlayer(playerID: number): void {
    this.playerData.delete(playerID);
    this.playerActions.delete(playerID);
  }

  /** Stop the ping service and clean up */
  public close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    this.playerData.clear();
    this.playerActions.clear();
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
      // Seed initial sync if not set yet (we pre-create records in addPlayer)
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