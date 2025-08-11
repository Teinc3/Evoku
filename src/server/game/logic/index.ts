import { getSudoku } from "sudoku-gen";

import BoardConverter from "@shared/mechanics/utils/BoardConverter";
import MatchStatus from "../../types/enums/matchstatus";
import ServerBoardModel from "../../models/logic/Board";

import type IPlayerState from "@shared/types/gamestate";
import type { GameLogicCallbacks } from "../../types/gamelogic";


/**
 * Centralised logical module, handling game mechanics and state interactions.
 */

export default class GameLogic {
  /** Base board and solution tuple */
  private readonly baseBoard: [number[], number[]];

  /** Game state for each player */
  private readonly gameStates: Map<number, IPlayerState<ServerBoardModel>>;

  /** Unique board solution (due to possible structural transformations) for each player */
  private readonly solutions = new Map<number, number[]>();

  /** Callbacks for game logic events. */
  private callbacks!: GameLogicCallbacks;

  constructor(
    difficulty: "easy" | "medium" | "hard" | "expert" | "impossible" = "easy",
  ) {
    this.gameStates = new Map();

    // Initialise a board
    const board = getSudoku(difficulty);
    this.baseBoard = [
      BoardConverter.toBoardArray(board.puzzle),
      BoardConverter.toBoardArray(board.solution)
    ];
  }

  /**
   * Add a player to the game and initialize their board according to the base board.
   * @returns Whether the player was successfully added.
   */
  public addPlayer(playerID: number): boolean {
    if (this.callbacks.getMatchStatus() !== MatchStatus.PREINIT) {
      return false; // Cannot add players after game has started
    }

    this.gameStates.set(playerID, { playerID });

    return true;
  }

  /**
   * Remove a player from the game, preserving state.
   * @return Whether the player was successfully removed.
   */
  public removePlayer(playerID: number): boolean {
    const playerState = this.gameStates.get(playerID);
    if (!playerState || this.callbacks.getMatchStatus() !== MatchStatus.PREINIT) {
      return false; // Player not found or already dead
    }

    return true;
  }

  /**
   * Set the callback functions for game events.
   */
  public setCallbacks(callbacks: GameLogicCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Apply a move to a player's board.
   * Returns whether the move was applied.
   */
  public setCellValue(playerID: number, cellIndex: number, value: number): boolean {
    const playerState = this.gameStates.get(playerID);
    if (!playerState) {
      return false; // Player not found or already eliminated
    }

    const board = playerState.gameState!.boardState;
    const result = board.setCell(cellIndex, value);
    if (result) {
      this.checkBoardProgresses([playerID]);
    }
    return result;
  }

  /** Initialise the game state for all players, and return the initial board value */
  public initGameStates(): number[] {
    // Notify all players of their initial game state
    for (const [playerID, playerState] of this.gameStates.entries()) {
      // Generate instances of board for each player
      const board = new ServerBoardModel(this.baseBoard[0]);

      // And set the initial game state
      playerState.gameState = {
        boardState: board,
        pupProgress: 0,
        powerups: [] // Feature TODO: Add entry powerups in the future.
      };

      // Also create a solution set for this player
      this.solutions.set(playerID, this.baseBoard[1]);
    }
    
    return this.baseBoard[0]; // Return the initial board value
  }

  /**
   * Get the solution of a cell for a player's board.
   * @param playerID 
   * @param cellIndex
   * @returns The solution value for the cell, or undefined if not available.
   */
  public getSolution(playerID: number, cellIndex: number): number | undefined {
    const solution = this.solutions.get(playerID);
    if (!solution) {
      return undefined; // No solution available for this player
    }
    return solution[cellIndex]; // Return the solution for the specific cell index
  }

  /**
   * Compute a hash of the game state, including all player states and properties.
   * @returns The computed hash of the game state.
   */
  public computeHash(): number {
    return Array.from(this.gameStates.entries()).reduce((acc, [playerID, state]) => {
      const playerBoardHash = state.gameState?.boardState.computeHash() ?? 0;
      return acc + (playerID + 1) * playerBoardHash;
    }, 0);
  }

  /**
   * Check board progress for specified players and report to lifecycle controller.
   * @param playerIDs List of player IDs to check. If empty, checks all players.
   */
  private checkBoardProgresses(playerIDs: number[] = []): void {
    const playersToCheck = playerIDs.length > 0 
      ? playerIDs 
      : Array.from(this.gameStates.keys());

    const progressData: { playerID: number; progress: number }[] = [];

    for (const playerID of playersToCheck) {
      const state = this.gameStates.get(playerID);
      if (state?.gameState) {
        const solution = this.solutions.get(playerID);
        if (solution) {
          const progress = state.gameState.boardState.progress(solution);
          progressData.push({ playerID, progress });
        }
      }
    }

    if (progressData.length > 0) {
      this.callbacks.onBoardProgressUpdate(progressData);
    }
  }

}