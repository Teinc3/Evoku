import { getSudoku } from "sudoku-gen";

import initPUPSlots from "@shared/types/utils/initPUPSlots";
import MatchStatus from "@shared/types/enums/matchstatus";
import { MechanicsActions, type PUPActions } from "@shared/types/enums/actions";
import BoardConverter from "@shared/mechanics/utils/BoardConverter";
import sharedConfig from "@shared/config";
import pupConfig from "@config/shared/pup.json";
import ServerBoardModel from "../../models/logic/Board";

import type { IPUPSlotState, ISlotEffect } from '@shared/types/gamestate/powerups';
import type { IPlayerState, IMatchState } from "@shared/types/gamestate";
import type ActionMap from "@shared/types/actionmap";
import type TimeCoordinator from "../time";
import type { GameLogicCallbacks } from "../../types/gamelogic";


/** Centralised logical module, handling game mechanics and stateful interactions*/
export default class GameStateController {
  /** Base board and solution tuple */
  private readonly baseBoard: [number[], number[]];
  /** Unique board solution (due to possible structural transformations) for each player */
  private readonly solutions = new Map<number, number[]>();

  /** Room state */
  public readonly matchState: IMatchState;
  /** Game state for each player */
  private readonly gameStates: Map<number, IPlayerState<ServerBoardModel>>;

  /** Callbacks for game logic events. */
  private callbacks!: GameLogicCallbacks;

  constructor(
    private readonly timeService: TimeCoordinator,
    difficulty: "easy" | "medium" | "hard" | "expert" | "impossible" = "easy",
  ) {
    this.matchState = {
      status: MatchStatus.PREINIT,
      phase: 0,
      currentPUPID: 0,
    };
    this.gameStates = new Map();

    // Initialise a board
    const board = getSudoku(difficulty);
    this.baseBoard = [
      BoardConverter.toBoardArray(board.puzzle),
      BoardConverter.toBoardArray(board.solution)
    ];
  }
  
  public get currentChallengeDuration(): number {
    return sharedConfig.game.challenge.duration[this.matchState.phase];
  }

  /**
   * Add a player to the game and initialize their board according to the base board.
   * @returns Whether the player was successfully added.
   */
  public addPlayer(playerID: number): boolean {
    if (this.matchState.status !== MatchStatus.PREINIT) {
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
    if (!playerState || this.matchState.status !== MatchStatus.PREINIT) {
      return false; // Player not found or already dead
    }

    return true;
  }

  /** Set the callback functions for game events */
  public setCallbacks(callbacks: GameLogicCallbacks): void {
    this.callbacks = callbacks;
  }

  /**
   * Apply a move to a player's board.
   * Returns whether the move was applied.
   */
  public setCellValue(playerID: number, data: ActionMap[MechanicsActions.SET_CELL]): {
    result: boolean;
    serverTime?: number; // If result is true
  } {
    const { clientTime, cellIndex, value } = data;
    const playerState = this.gameStates.get(playerID);
    if (!playerState) {
      return { result: false }; // Player not found or already eliminated
    }

    // First check sync-only timing validation
    const estServerTime = this.timeService.assessTiming(playerID, clientTime);
    if (estServerTime < 0) {
      return { result: false }; // Sync timing validation failed
    }

    // Try to set the cell value with estimated server time for cooldown validation
    const board = playerState.gameState!.boardState;
    const result = board.setCell(cellIndex, value, estServerTime);

    if (!result) {
      return { result: false }; // Cell setting failed (could be cooldown or validation)
    }

    // Update the last action time and obtain the actual server time
    const serverTime = this.timeService.updateLastActionTime(
      playerID,
      MechanicsActions.SET_CELL,
      clientTime
    );
    this.checkBoardProgresses([playerID]);
    this.checkPUPProgress(playerID, cellIndex, serverTime);

    return { result: true, serverTime };
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
        powerups: initPUPSlots()
      };

      if (process.env['DEBUG_START_PUP'] === 'true') {
        playerState.gameState.pupProgress = 100;
        this.callbacks.onProgressUpdate(false, [{ playerID, progress: 100 }]);
      }

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
      this.callbacks.onProgressUpdate(true, progressData);
    }
  }

  /** Checks for completed cell objectives, and increments PUP progress accordingly */
  private checkPUPProgress(playerID: number, cellIndex: number, serverTime: number): void {
    // See if current cell value fits solution
    const gameState = this.gameStates.get(playerID)?.gameState;
    if (!gameState) {
      return;
    }
    const boardState = gameState.boardState;
    const solution = this.solutions.get(playerID);
    if (!solution) {
      return;
    }

    const cell = boardState.board[cellIndex];
    if (cell.value !== solution[cellIndex]) {
      return; // Incorrect value, no progress
    }

    const originalProgress = gameState.pupProgress;

    if (!cell.pupProgressSet) {
      cell.pupProgressSet = true;
      if (process.env['DEBUG_START_PUP'] === 'true') {
        gameState.pupProgress += 100;
      }
      gameState.pupProgress += sharedConfig.game.objectives.normalGain[this.matchState.phase];
    }
    if (cell.goldenObjectiveActive) {
      gameState.pupProgress += sharedConfig.game.objectives.goldenGain[this.matchState.phase];
      cell.goldenObjectiveActive = false;
    }

    // Clamp progress to 100%
    gameState.pupProgress = Math.min(gameState.pupProgress, 100);

    if (gameState.pupProgress !== originalProgress) {
      // Broadcast PUP progress
      this.callbacks.onProgressUpdate(false, [{ playerID, progress: gameState.pupProgress }]);
    }
    this.callbacks.onCellSolved(playerID, cellIndex, serverTime);
  }

  /** Returns whether the objective that the given cell belongs to is fully and correctly filled */
  public isObjectiveSolvedForCell(
    playerID: number,
    objectiveType: number,
    cellIndex: number
  ): boolean {
    const gameState = this.gameStates.get(playerID)?.gameState;
    if (!gameState) {
      return false;
    }

    const boardState = gameState.boardState;
    const rowIndex = Math.floor(cellIndex / 9);
    const colIndex = cellIndex % 9;
    const boxIndex = Math.floor(rowIndex / 3) * 3 + Math.floor(colIndex / 3);

    switch (objectiveType) {
      case 0: {
        return this.isRowSolved(boardState, rowIndex);
      }
      case 1: {
        return this.isColSolved(boardState, colIndex);
      }
      case 2: {
        return this.isBoxSolved(boardState, boxIndex);
      }
      default: {
        return false;
      }
    }
  }

  public getPlayerPowerups(
    playerID: number
  ): readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState] | undefined {
    return this.gameStates.get(playerID)?.gameState?.powerups;
  }

  private isRowSolved(boardState: ServerBoardModel, rowIndex: number): boolean {
    const start = rowIndex * 9;
    for (let offset = 0; offset < 9; offset += 1) {
      const index = start + offset;
      if (!boardState.board[index].pupProgressSet && !boardState.board[index].fixed) {
        return false;
      }
    }
    return true;
  }

  private isColSolved(boardState: ServerBoardModel, colIndex: number): boolean {
    for (let row = 0; row < 9; row += 1) {
      const index = row * 9 + colIndex;
      if (!boardState.board[index].pupProgressSet && !boardState.board[index].fixed) {
        return false;
      }
    }
    return true;
  }

  private isBoxSolved(boardState: ServerBoardModel, boxIndex: number): boolean {
    const boxRow = Math.floor(boxIndex / 3) * 3;
    const boxCol = (boxIndex % 3) * 3;

    for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
      for (let colOffset = 0; colOffset < 3; colOffset += 1) {
        const row = boxRow + rowOffset;
        const col = boxCol + colOffset;
        const index = row * 9 + col;
        if (!boardState.board[index].pupProgressSet && !boardState.board[index].fixed) {
          return false;
        }
      }
    }

    return true;
  }

  /** Handles drawing a PUP for a player */
  public reservePUPDraw(playerID: number): number {
    const playerState = this.gameStates.get(playerID);
    const gameState = playerState?.gameState;
    if (!gameState) {
      return -1;
    }

    if (gameState.pupProgress !== 100) {
      return -1;
    }

    const emptySlotIndexes = gameState.powerups
      .map((slot, index) => {
        if (slot.pup !== undefined) {
          return -1;
        }
        if (slot.locked) {
          return -1;
        }
        return index;
      })
      .filter(index => index !== -1);

    if (emptySlotIndexes.length === 0) {
      return -1;
    }

    const randomIndex = Math.floor(Math.random() * emptySlotIndexes.length);
    const slotIndex = emptySlotIndexes[randomIndex];
    const slot = gameState.powerups[slotIndex];
    if (!slot) {
      return -1;
    }

    slot.locked = true;

    // Reset PUP progress immediately when reserving a draw.
    gameState.pupProgress = 0;
    this.callbacks.onProgressUpdate(false, [{ playerID, progress: 0 }]);

    return slotIndex;
  }

  public drawRandomPUP(playerID: number, slotIndex: number, type: number): {
    pupID: number;
    type: number;
    level: number;
    slotIndex: number;
  } | null {
    const playerState = this.gameStates.get(playerID);
    const gameState = playerState?.gameState;
    if (!gameState) {
      return null;
    }

    const slot = gameState.powerups[slotIndex];
    if (!slot || slot.pup !== undefined) {
      return null;
    }

    if (!slot.locked) {
      return null;
    }

    const pupID = this.matchState.currentPUPID!;
    this.matchState.currentPUPID = pupID + 1;
    
    const level = 1; // TODO: Implement level logic

    slot.pup = {
      pupID,
      type,
      level,
    };

    slot.locked = false;

    return {
      pupID,
      type,
      level,
      slotIndex,
    };
  }

  public consumePUP(
    action: PUPActions,
    playerID: number,
    pupID: number,
    clientTime: number
  ): number | false {
    const serverTime = this.timeService.assessTiming(playerID, clientTime);
    if (serverTime < 0) {
      return false;
    }

    const slot = this.findPUPSlotByPupID(playerID, pupID);
    if (this.matchState.status !== MatchStatus.ONGOING
      || !slot || slot.locked || !slot.pup || slot.lastCooldownEnd > serverTime) {
      return false;
    }

    this.timeService.updateLastActionTime(
      playerID,
      action,
      clientTime,
      serverTime
    );

    // Differentiate theme
    if (pupConfig[slot.pup.type].theme === true) {
      // Yang pup - set challenge cooldown
      slot.lastCooldownEnd = serverTime + this.currentChallengeDuration;
      // Challenge timer task will be created in the respective handlers
    } else {
      // Yin pup - consume immediately
      slot.pup = undefined;
    }
    return serverTime;
  }

  /**
   * Set or clear the pendingEffect for a specific PUP slot (server-side authoritative).
   * Returns true if the slot was found and updated.
   */
  public setPUPPendingEffect(playerID: number, pupID: number, effect?: ISlotEffect): boolean {
    const slot = this.findPUPSlotByPupID(playerID, pupID);
    if (!slot || !slot.pup) {
      return false;
    }

    slot.pup.pendingEffect = effect;
    return true;
  }

  public findPUPSlotByPupID(playerID: number, pupID: number): IPUPSlotState | undefined {
    const playerState = this.gameStates.get(playerID);
    const gameState = playerState?.gameState;
    if (!gameState) {
      return undefined;
    }

    for (const slot of gameState.powerups) {
      if (slot.pup?.pupID === pupID) {
        return slot;
      }
    }

    return undefined;
  }
}
