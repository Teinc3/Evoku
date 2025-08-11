import { getSudoku } from "sudoku-gen";

import BoardConverter from "@shared/mechanics/utils/BoardConverter";
import MatchStatus from "../../types/enums/matchstatus";
import ServerBoardModel from "../../models/logic/Board";

import type IPlayerState from "@shared/types/gamestate";


/**
 * Centralised logical module, handling game mechanics and state interactions.
 */
export default class GameLogic {
  /**
   * Base board and solution tuple
   */
  private readonly baseBoard: [number[], number[]];
  /**
   * Game state for each player.
   */
  private readonly gameStates: Map<number, IPlayerState<ServerBoardModel>>;
  /**
   * Unique board solution (due to possible transformations of board structure) for each player.
   */
  private readonly solutions = new Map<number, number[]>();

  private readonly matchStatusProvider: () => MatchStatus;

  constructor(
    difficulty: "easy" | "medium" | "hard" | "expert" | "impossible" = "easy",
    statusProvider: () => MatchStatus
  ) {
    this.gameStates = new Map();
    this.matchStatusProvider = statusProvider;

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
    if (this.matchStatusProvider() !== MatchStatus.PREINIT) {
      return false; // Cannot add players after game has started
    }

    this.gameStates.set(playerID, {
      playerID,
      isAlive: true
    });

    return true;
  }

  /**
   * Remove a player from the game, preserving state.
   * @return Whether the player was successfully removed.
   */
  public removePlayer(playerID: number): boolean {
    const playerState = this.gameStates.get(playerID);
    if (
      !playerState || !playerState.isAlive
      || this.matchStatusProvider() !== MatchStatus.PREINIT
    ) {
      return false; // Player not found or already dead
    }

    playerState.isAlive = false; // Mark player as dead
    return true;
  }

  /**
   * Apply a move to a player's board.
   * Returns whether the move was applied.
   */
  public setCellValue(playerID: number, cellIndex: number, value: number): boolean {
    const playerState = this.gameStates.get(playerID);
    if (!playerState || !playerState.isAlive) {
      return false; // Player not found or already eliminated
    }

    const board = playerState.gameState!.boardState;
    return board.setCell(cellIndex, value);
  }

  /**
   * Initialise the game state for all players
   */
  public initGameStates(): void {
    // Notify all players of their initial game state
    for (const [playerID, playerState] of this.gameStates.entries()) {
      // Generate instances of board for each player
      const board = new ServerBoardModel(this.baseBoard[0]);

      // And set the initial game state
      playerState.gameState = {
        boardState: board,
        pupProgress: 0,
        powerups: [] // Feature: Add entry powerups in the future.
      };

      // Also create a solution set for this player
      this.solutions.set(playerID, this.baseBoard[1]);
    }
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
      return acc + (playerID + 1) * (playerBoardHash + Number(state.isAlive));
    }, 0);
  }

  /**
   * Check if a player has won the game.
   * @returns The player ID of the winner, or false if no winner yet.
   */
  private checkAndDeclareWinner(): number | boolean {
    const alivePlayers = Array.from(this.gameStates.entries())
      .filter(([_, state]) => state.isAlive);

    if (alivePlayers.length === 1) {
      return alivePlayers[0][0];
    }

    return false; // No winner yet
  }

}