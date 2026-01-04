import initPUPSlots from '@shared/types/utils/initPUPSlots';
import MatchStatus from '@shared/types/enums/matchstatus';
import { PlayerActions } from '@shared/types/enums/actions';
import ClientBoardModel from '../models/Board';
import ClientTimeCoordinator from './ClientTimeCoordinator';

import type { IMatchState, IPlayerState } from '@shared/types/gamestate';
import type {
  ActionContractC2S
} from '@shared/types/contracts/components/extendables/ActionContract';
import type { MatchFoundContract } from '@shared/types/contracts';


/**
 * Client-side manager representing the state of a game,
 * following the same pattern as server's GameStateController. 
 * Manages player states for a single game session, owned by UI pages.
 */
export default class GameStateManager {
  /** Time Coordinator Class */
  public timeCoordinator!: ClientTimeCoordinator;
  /** Match state */
  public matchState!: IMatchState;
  /** Game state for each player in this game session */
  private gameStates!: Map<number, IPlayerState<ClientBoardModel>>;
  /** Player information (username, etc.) keyed by playerID */
  public playerInfo!: Map<number, { username: string }>;
  /** Pending actions keyed by actionID */
  public pendingActions!: Map<number, ActionContractC2S & {
    action: PlayerActions
  }>;
  /** Home player's ID */
  public myID!: number;

  constructor(private expectedPlayerCount: number) {
    this.resetBlankState();
  }

  /**
   * Initialize blank state with empty/default data for duel games
   * This ensures components always have valid data to bind to
   */
  private resetBlankState(): void {
    this.timeCoordinator = new ClientTimeCoordinator();
    this.matchState = {
      status: MatchStatus.PREINIT,
      phase: 0
    };
    this.gameStates = new Map();
    this.playerInfo = new Map();
    this.pendingActions = new Map();
    this.myID = 0;
    for (let i = 0; i < this.expectedPlayerCount; i++) {
      this.addPlayer(i, '');
    }
  }

  /**
   * Initialise the gamestate based on data from the MATCH_FOUND packet
   * @param data The match found contract data
   */
  public createGame(data: MatchFoundContract): void {
    this.myID = data.myID;

    // Override with real data
    this.playerInfo.clear();
    this.gameStates.clear();

    for (const player of data.players) {
      this.addPlayer(player.playerID, player.username);
    }
  }
  
  /** Clear all game state and player information, resetting to clean state */
  public clearMatchData(): void {
    this.resetBlankState();
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

    this.playerInfo.set(playerID, { username });
    this.gameStates.set(playerID, {
      playerID,
      gameState: {
        boardState: new ClientBoardModel(),
        pupProgress: 0,
        powerups: initPUPSlots()
      }
    });
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
   * @returns Player info
   */
  public getPlayerInfo(playerID: number): { username: string; playerID: number } {
    const info = this.playerInfo.get(playerID);
    const username = info ? info.username : 'Unknown Player';
    return {
      username,
      playerID
    };
  }

  /**
   * Get a player's game state
   * @param playerID The player's ID
   * @returns The player's state
   */
  public getPlayerState(playerID: number): IPlayerState<ClientBoardModel> {
    return this.gameStates.get(playerID)!;
  }

  /**
   * Get a player's board by ID
   * @param playerID The player's ID
   * @returns The player's board
   */
  public getPlayerBoard(playerID: number): ClientBoardModel {
    return this.getPlayerState(playerID).gameState!.boardState;
  }

  /**
   * Initialize game states for all players with their boards
   * @param initialBoard The initial board array
   */
  public initGameStates(initialBoard: number[]): void {
    for (const playerState of this.gameStates.values()) {
      // Load puzzle data into existing zombie board
      playerState.gameState!.boardState.initBoard(initialBoard);
    }
  }

  /** Check if the local player can spin the PUP spinner */
  public get canSpinPupSpinner(): boolean {
    const powerups = this.getPlayerState(this.myID).gameState?.powerups;
    if (!powerups) {
      return true;
    }

    return powerups.some(slot => !slot.pup && !slot.locked
      && Math.max(slot.lastCooldownEnd, slot.pendingCooldownEnd ?? 0)
        < this.timeCoordinator.clientTime
    );
  }
}
