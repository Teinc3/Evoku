import { Injectable, signal } from '@angular/core';

import type PlayerInfoContract from '@shared/types/contracts/components/custom/PlayerInfoContract';


/**
 * Service for managing matchmaking state and match data.
 * Stores queue status and match information for use across components.
 */
@Injectable({
  providedIn: 'root'
})
export default class MatchmakingService {
  /** Signal for the number of players currently in queue */
  private readonly _playersInQueue = signal<number>(0);
  public readonly playersInQueue = this._playersInQueue.asReadonly();

  /** Signal for the current player's ID in the match */
  private readonly _myPlayerID = signal<number | null>(null);
  public readonly myPlayerID = this._myPlayerID.asReadonly();

  /** Signal for all players in the match */
  private readonly _players = signal<PlayerInfoContract[]>([]);
  public readonly players = this._players.asReadonly();

  /**
   * Update the number of players in queue
   * @param count Number of players currently in queue
   */
  updatePlayersInQueue(count: number): void {
    this._playersInQueue.set(count);
  }

  /**
   * Store match information when a match is found
   * @param myID The current player's ID in the match
   * @param players Array of all players in the match
   */
  setMatchInfo(myID: number, players: PlayerInfoContract[]): void {
    this._myPlayerID.set(myID);
    this._players.set(players);
  }

  /**
   * Clear all matchmaking state (used when leaving queue or match)
   */
  clearMatchInfo(): void {
    this._myPlayerID.set(null);
    this._players.set([]);
    this._playersInQueue.set(0);
  }

  /**
   * Get opponent information (assumes 1v1 match)
   * @returns The opponent's player info, or null if not in a match
   */
  getOpponent(): PlayerInfoContract | null {
    const myID = this._myPlayerID();
    const allPlayers = this._players();

    if (myID === null || allPlayers.length !== 2) {
      return null;
    }

    return allPlayers.find(p => p.playerID !== myID) ?? null;
  }

  /**
   * Get the current player's information
   * @returns The current player's info, or null if not in a match
   */
  getMyInfo(): PlayerInfoContract | null {
    const myID = this._myPlayerID();
    const allPlayers = this._players();

    if (myID === null || allPlayers.length === 0) {
      return null;
    }

    return allPlayers.find(p => p.playerID === myID) ?? null;
  }
}
