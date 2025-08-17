import TimeValidationReason from "../../types/enums/timevalidation";

import type PlayerActions from "@shared/types/enums/actions/match/player";
import type { PlayerActionData } from "../../types/time";
import type SyncProfile from "../../models/networking/SyncProfile";


/**
 * Validates action timing and maintains action history for anti-cheat purposes.
 * Handles monotonic validation, rate limiting, and drift detection.
 */
export default class ActionValidator {
  private playerActions = new Map<number, PlayerActionData[]>();

  static readonly MAX_ACTION_HISTORY_COUNT = 30;
  static readonly MAX_CUMULATIVE_DRIFT = 50; // ms
  static readonly MIN_ACTION_INTERVAL = {
    actions: 5,
    interval: 500
  };

  /** 
   * Validate action timing and return estimated server time or validation error.
   * @returns Estimated server time if valid (>= 0), or TimeValidationReason if invalid
   */
  public assessTiming(
    playerID: number,
    clientTime: number,
    currentServerTime: number,
    syncProfile: SyncProfile | undefined,
    fallbackServerTime: number
  ): number {
    if (!syncProfile) {
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
        .slice(-ActionValidator.MIN_ACTION_INTERVAL.actions)
        .filter(
          a => a.serverTime >= currentServerTime - ActionValidator.MIN_ACTION_INTERVAL.interval
        );
      if (recentWindow.length >= ActionValidator.MIN_ACTION_INTERVAL.actions) {
        return TimeValidationReason.RATE_LIMIT;
      }

      // 3. Cumulative drift: only after first sync (PONG) established
      if (syncProfile.hasInitialSync()) {
        const newCumulativeDrift
          = syncProfile.calculateCumulativeDrift(clientTime, currentServerTime);
        if (Math.abs(newCumulativeDrift) > ActionValidator.MAX_CUMULATIVE_DRIFT) {
          return TimeValidationReason.DRIFT_EXCEEDED;
        }
      }
    }

    return this.estimateServerTime(playerID, clientTime, syncProfile, fallbackServerTime);
  }

  /** Estimate serverTime for a given clientTime, clamped to be per-player monotonic */
  public estimateServerTime(
    playerID: number,
    clientTime: number,
    syncProfile: SyncProfile | undefined,
    fallbackServerTime: number
  ): number {
    const estimated = syncProfile
      ? syncProfile.clientToServerTime(clientTime)
      : fallbackServerTime;
    
    // Use the last committed action's server time as the monotonic baseline
    const actionHistory = this.playerActions.get(playerID);
    const lastActionServerTime = actionHistory && actionHistory.length > 0 
      ? actionHistory[actionHistory.length - 1].serverTime 
      : 0;
    
    return Math.max(estimated, lastActionServerTime, 0);
  }

  /**
   * Commit an action after successful validation.
   * @returns The current server time for broadcasting.
   */
  public updateLastActionTime(
    playerID: number,
    action: PlayerActions,
    clientTime: number,
    serverTime: number
  ): number {
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
      serverTime
    });
    
    // Keep only recent actions
    if (actionHistory.length > ActionValidator.MAX_ACTION_HISTORY_COUNT) {
      actionHistory.splice(0, actionHistory.length - ActionValidator.MAX_ACTION_HISTORY_COUNT);
    }
    
    return serverTime;
  }

  /** Remove player action history */
  public removePlayer(playerID: number): void {
    this.playerActions.delete(playerID);
  }

  /** Clear all action histories */
  public clear(): void {
    this.playerActions.clear();
  }
}
