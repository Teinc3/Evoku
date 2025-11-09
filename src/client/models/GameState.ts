import ClientBoardModel from './Board';

import type IPlayerState from '@shared/types/gamestate';
import type { MatchFoundContract } from '@shared/types/contracts';


/**
 * Client-side model representing the state of a game,
 * following the same pattern as server's GameStateController. 
 * Manages player states for a single game session, owned by UI pages.
 */
export default class GameStateModel {
  /** Game state for each player in this game session */
  private readonly gameStates: Map<number, IPlayerState<ClientBoardModel>> = new Map();
  /** Player information (username, etc.) keyed by playerID */
  public readonly playerInfo: Map<number, { username: string }> = new Map();
  /** Current player's ID */
  public myID: number | null = null;

  /**
   * Set the match data from the MATCH_FOUND packet and initialize player states
   * @param data The match found contract data
   */
  public setMatchData(data: MatchFoundContract): void {
    this.myID = data.myID;

    // Initialize player states and info for all players in the match
    for (const player of data.players) {
      this.addPlayer(player.playerID, player.username);
    }
  }

  /**
   * Clear all game state and player information
   */
  public clearMatchData(): void {
    this.myID = null;
    this.gameStates.clear();
    this.playerInfo.clear();
  }

  /**
   * Add a player to the game and initialize their state
   * @param playerID The player's ID
   * @param username The player's username
   * @returns Whether the player was successfully added
   */
  public addPlayer(playerID: number, username: string): boolean {
    if (this.gameStates.has(playerID)) {
      return false; // Player already exists
    }

    this.gameStates.set(playerID, { playerID });
    this.playerInfo.set(playerID, { username });
    return true;
  }

  /**
   * Remove a player from the game
   * @param playerID The player's ID
   * @returns Whether the player was successfully removed
   */
  public removePlayer(playerID: number): boolean {
    const removedState = this.gameStates.delete(playerID);
    const removedInfo = this.playerInfo.delete(playerID);
    return removedState && removedInfo;
  }

  /**
   * Get a player's information by ID
   * @param playerID The player's ID
   * @returns Player info or null if not found
   */
  public getPlayerInfo(playerID: number): { username: string; playerID: number } | null {
    const info = this.playerInfo.get(playerID);
    if (!info) {
      return null;
    }

    return {
      username: info.username,
      playerID
    };
  }

  /**
   * Get a player's game state
   * @param playerID The player's ID
   * @returns The player's state or undefined if not found
   */
  public getPlayerState(playerID: number): IPlayerState<ClientBoardModel> | undefined {
    return this.gameStates.get(playerID);
  }

  /**
   * Initialize game states for all players with their boards
   * @param initialBoard The initial board array
   */
  public initGameStates(initialBoard: number[]): void {
    for (const playerState of this.gameStates.values()) {
      // Create board instance for each player
      const board = new ClientBoardModel(initialBoard);

      // Set the initial game state
      playerState.gameState = {
        boardState: board,
        pupProgress: 0,
        powerups: [] // Feature TODO: Add entry powerups in the future.
      };
    }
  }
}
