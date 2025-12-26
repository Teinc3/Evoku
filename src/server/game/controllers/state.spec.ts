import MatchStatus from '@shared/types/enums/matchstatus';
import GameStateController from '.';

import type { IPlayerState } from '@shared/types/gamestate';
import type { SetCellContract } from '@shared/types/contracts';
import type TimeCoordinator from '../time';
import type { GameLogicCallbacks } from '../../types/gamelogic';
import type ServerBoardModel from '../../models/logic/Board';


// Mock the board converter
jest.mock('../../../shared/mechanics/utils/BoardConverter', () => ({
  toBoardArray: jest.fn((puzzle: string) => {
    return puzzle.replaceAll('-', '0').split('').map(Number);
  })
}));

// Mock getSudoku function
jest.mock('sudoku-gen', () => ({
  getSudoku: jest.fn((difficulty: string) => ({
    puzzle: '41--75-----53--7--2-36-81--7-9--25-1-3--9-47--2-1-7---6587--9-----26-8--1925---47',
    solution: '416975238985321764273648159769432581531896472824157396658714923347269815192583647',
    difficulty
  }))
}));

// Mock ServerBoardModel
const mockServerBoardModel = {
  setCell: jest.fn((_index: number, _value: number, _serverTime: number) => true),
  progress: jest.fn(() => 45),
  computeHash: jest.fn(() => 12345),
  board: Array.from({ length: 81 }, (_, i) => ({
    value: i % 9 + 1, // Mock values 1-9 repeating
    pupProgressSet: false,
    goldenObjectiveActive: false,
    fixed: i < 20 // Some fixed cells
  }))
};

jest.mock('../../models/logic/Board', () => {
  return jest.fn().mockImplementation(() => mockServerBoardModel);
});

describe('GameStateController', () => {
  let gameState: GameStateController;
  let mockTimeService: jest.Mocked<TimeCoordinator>;
  let mockCallbacks: jest.Mocked<GameLogicCallbacks>;

  beforeEach(() => {
    // Create mock TimeCoordinator
    mockTimeService = {
      assessTiming: jest.fn(),
      updateLastActionTime: jest.fn(),
      start: jest.fn()
    } as unknown as jest.Mocked<TimeCoordinator>;

    // Create GameStateController
    gameState = new GameStateController(mockTimeService, 'easy');

    // Create mock callbacks
    mockCallbacks = {
      onProgressUpdate: jest.fn()
    };

    gameState.setCallbacks(mockCallbacks);

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create GameStateController with default difficulty', () => {
      const controller = new GameStateController(mockTimeService);
      expect(controller).toBeInstanceOf(GameStateController);
    });

    it('should create GameStateController with specified difficulty', () => {
      const controller = new GameStateController(mockTimeService, 'hard');
      expect(controller).toBeInstanceOf(GameStateController);
    });

    it('should initialize empty game states map', () => {
      expect(gameState.computeHash()).toBe(0); // Empty state hash
    });
  });

  describe('addPlayer', () => {
    it('should add player during PREINIT phase', () => {
      const result = gameState.addPlayer(1);

      expect(result).toBe(true);
    });

    it('should reject player addition during ONGOING phase', () => {
      gameState.matchState.status = MatchStatus.ONGOING;

      const result = gameState.addPlayer(1);

      expect(result).toBe(false);
    });

    it('should reject player addition during ENDED phase', () => {
      gameState.matchState.status = MatchStatus.ENDED;

      const result = gameState.addPlayer(1);

      expect(result).toBe(false);
    });

    it('should handle multiple players', () => {
      const result1 = gameState.addPlayer(1);
      const result2 = gameState.addPlayer(2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('removePlayer', () => {
    beforeEach(() => {
      gameState.addPlayer(1);
    });

    it('should remove existing player during PREINIT', () => {
      const result = gameState.removePlayer(1);
      expect(result).toBe(true);
    });

    it('should reject removal of non-existent player', () => {
      const result = gameState.removePlayer(999);
      expect(result).toBe(false);
    });

    it('should reject removal during ONGOING phase', () => {
      gameState.matchState.status = MatchStatus.ONGOING;

      const result = gameState.removePlayer(1);
      expect(result).toBe(false);
    });
  });

  describe('setCallbacks', () => {
    it('should set callback functions', () => {
      const newCallbacks: GameLogicCallbacks = {
        onProgressUpdate: jest.fn()
      };

      gameState.setCallbacks(newCallbacks);

      // Verify callbacks are used
      expect(() => gameState.addPlayer(1)).not.toThrow();
    });
  });

  describe('setCellValue', () => {
    const playerID = 1;
    const mockData: SetCellContract = {
      clientTime: 1000,
      cellIndex: 15,
      value: 7,
      actionID: 1001
    };

    beforeEach(() => {
      // Add player and initialize game state
      gameState.addPlayer(playerID);
      gameState.initGameStates();
    });

    it('should successfully process valid move', () => {
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockTimeService.updateLastActionTime.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(true);

      const result = gameState.setCellValue(playerID, mockData);

      expect(result.result).toBe(true);
      expect(result.serverTime).toBe(1001);
      expect(mockTimeService.assessTiming).toHaveBeenCalledWith(playerID, mockData.clientTime);
      expect(mockServerBoardModel.setCell).toHaveBeenCalledWith(
        mockData.cellIndex,
        mockData.value,
        1001
      );
    });

    it('should reject move with invalid timing', () => {
      mockTimeService.assessTiming.mockReturnValue(-1); // Invalid timing

      const result = gameState.setCellValue(playerID, mockData);

      expect(result.result).toBe(false);
      expect(result.serverTime).toBeUndefined();
      expect(mockServerBoardModel.setCell).not.toHaveBeenCalled();
    });

    it('should reject move for unknown player', () => {
      const result = gameState.setCellValue(999, mockData);

      expect(result.result).toBe(false);
      expect(result.serverTime).toBeUndefined();
    });

    it('should reject invalid board move', () => {
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(false); // Board rejects move

      const result = gameState.setCellValue(playerID, mockData);

      expect(result.result).toBe(false);
      expect(result.serverTime).toBeUndefined();
    });

    it('should trigger progress check on successful move', () => {
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockTimeService.updateLastActionTime.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(true);
      mockServerBoardModel.progress.mockReturnValue(75);

      gameState.setCellValue(playerID, mockData);

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        true,
        [{ playerID, progress: 75 }]
      );
    });

    it('should increment PUP progress when cell is set correctly for the first time', () => {
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockTimeService.updateLastActionTime.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(true);
      
      // Mock solution to match the value (7)
      const mockSolution = new Array(81).fill(0);
      mockSolution[mockData.cellIndex] = 7;
      gameState['solutions'].set(playerID, mockSolution);

      // Mock cell state
      const mockCell = {
        value: 7,
        pupProgressSet: false,
        goldenObjectiveActive: false,
        fixed: false
      };
      
      // Use the existing mockServerBoardModel but update the cell
      mockServerBoardModel.board[mockData.cellIndex] = mockCell;
      
      const mockGameState = {
        boardState: mockServerBoardModel,
        pupProgress: 0,
        powerups: [
          { slotIndex: 0, lastCooldownEnd: 0 },
          { slotIndex: 0, lastCooldownEnd: 0 },
          { slotIndex: 0, lastCooldownEnd: 0 }
        ]
      };
      gameState['gameStates'].set(
        playerID,
        { playerID, gameState: mockGameState } as unknown as IPlayerState<ServerBoardModel>
      );

      // Set phase to 0
      gameState.matchState.phase = 0;

      gameState.setCellValue(playerID, mockData);

      // Check if pupProgress increased
      expect(mockGameState.pupProgress).toBeGreaterThan(0);
      expect(mockCell.pupProgressSet).toBe(true);
    });
  });

  describe('initGameStates', () => {
    beforeEach(() => {
      gameState.addPlayer(1);
      gameState.addPlayer(2);
    });

    it('should initialize game states for all players', () => {
      const initialBoard = gameState.initGameStates();

      expect(initialBoard).toEqual(expect.any(Array));
      expect(initialBoard).toHaveLength(81); // 9x9 Sudoku board
    });

    it('should return consistent initial board', () => {
      const board1 = gameState.initGameStates();
      const board2 = gameState.initGameStates();

      expect(board1).toEqual(board2);
    });
  });

  describe('getSolution', () => {
    const playerID = 1;

    beforeEach(() => {
      gameState.addPlayer(playerID);
      gameState.initGameStates();
    });

    it('should return solution for valid player and cell', () => {
      const solution = gameState.getSolution(playerID, 15);

      expect(solution).toBe(7);
    });

    it('should return undefined for unknown player', () => {
      const solution = gameState.getSolution(999, 15);

      expect(solution).toBeUndefined();
    });

    it('should handle all cell indices', () => {
      const expectedSolution
        = '416975238985321764273648159769432581531896472824157396658714923347269815192583647';
      for (let i = 0; i < 81; i++) {
        const solution = gameState.getSolution(playerID, i);
        expect(solution).toBe(parseInt(expectedSolution[i]));
      }
    });
  });

  describe('computeHash', () => {
    it('should return 0 for empty game state', () => {
      const hash = gameState.computeHash();
      expect(hash).toBe(0);
    });

    it('should return non-zero hash after adding players', () => {
      gameState.addPlayer(1);
      gameState.initGameStates(); // Initialize game states

      const hash = gameState.computeHash();
      expect(hash).not.toBe(0);
    });

    it('should return different hashes for different states', () => {
      gameState.addPlayer(1);
      gameState.initGameStates();
      const hash1 = gameState.computeHash();

      gameState.addPlayer(2);
      gameState.initGameStates(); // Re-initialize with new player
      const hash2 = gameState.computeHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should return consistent hash for same state', () => {
      gameState.addPlayer(1);

      const hash1 = gameState.computeHash();
      const hash2 = gameState.computeHash();

      expect(hash1).toBe(hash2);
    });
  });

  describe('progress tracking', () => {
    const playerID = 1;

    beforeEach(() => {
      gameState.addPlayer(playerID);
      gameState.initGameStates();
    });

    it('should track progress updates', () => {
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockTimeService.updateLastActionTime.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(true);
      mockServerBoardModel.progress.mockReturnValue(33);

      gameState.setCellValue(playerID, {
        clientTime: 1000,
        cellIndex: 0,
        value: 1,
        actionID: 1002
      });

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        true,
        [{ playerID, progress: 33 }]
      );
    });

    it('should handle 100% completion', () => {
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockTimeService.updateLastActionTime.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(true);
      mockServerBoardModel.progress.mockReturnValue(100);

      gameState.setCellValue(playerID, {
        clientTime: 1000,
        cellIndex: 80,
        value: 9,
        actionID: 1003
      });

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        true,
        [{ playerID, progress: 100 }]
      );
    });
  });

  describe('checkBoardProgresses (private method)', () => {
    beforeEach(() => {
      gameState.addPlayer(1);
      gameState.addPlayer(2);
      gameState.initGameStates();
    });

    it('should check progress for specific players when playerIDs provided', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Access private method via type assertion
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses([1]);

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        true,
        [{ playerID: 1, progress: 45 }]
      );
    });

    it('should check progress for all players when no playerIDs provided', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Access private method via type assertion
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses();

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        true,
        [
          { playerID: 1, progress: 45 },
          { playerID: 2, progress: 45 }
        ]
      );
    });

    it('should handle player without gameState', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Manually remove gameState from player 1
      const gameStates = (gameState as unknown as { 
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      const playerState = gameStates.get(1);
      if (playerState) {
        delete playerState.gameState;
      }

      // Access private method via type assertion - check only player 1
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses([1]);

      // Should not call callback since player 1 has no gameState
      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });

    it('should handle player without solution', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Manually remove solution for player 1
      const solutions = (gameState as unknown as { solutions: Map<number, number[]> }).solutions;
      solutions.delete(1);

      // Access private method via type assertion - check only player 1
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses([1]);

      // Should not call callback since player 1 has no solution
      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });

    it('should not call callback when no progress data available', () => {
      // Clear all players
      const gameStates = (gameState as unknown as { 
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      gameStates.clear();

      // Access private method via type assertion
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses();

      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });

    it('should handle empty playerIDs array', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Access private method via type assertion
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses([]);

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        true,
        [
          { playerID: 1, progress: 45 },
          { playerID: 2, progress: 45 }
        ]
      );
    });
  });

  describe('checkPUPProgress', () => {
    const playerID = 1;
    const cellIndex = 0; // Solution value is 4

    beforeEach(() => {
      gameState.addPlayer(playerID);
      gameState.initGameStates();
    });

    it('should increment PUP progress when value matches solution and progress not set', () => {
      // Set cell value to match solution (4)
      mockServerBoardModel.board[cellIndex].value = 4;
      mockServerBoardModel.board[cellIndex].pupProgressSet = false;

      // Access private method
      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(playerID, cellIndex);

      // Check progress incremented
      const gameStates = (gameState as unknown as {
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      const playerState = gameStates.get(playerID);
      expect(playerState?.gameState?.pupProgress).toBe(20);
      expect(mockServerBoardModel.board[cellIndex].pupProgressSet).toBe(true);

      // Check callback called
      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        false,
        [{ playerID, progress: 20 }]
      );
    });

    it('should not increment PUP progress when pupProgressSet is already true', () => {
      mockServerBoardModel.board[cellIndex].value = 4;
      mockServerBoardModel.board[cellIndex].pupProgressSet = true;

      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(playerID, cellIndex);

      const gameStates = (gameState as unknown as {
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      const playerState = gameStates.get(playerID);
      expect(playerState?.gameState?.pupProgress).toBe(0);
      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });

    it('should not increment PUP progress when cell value does not match solution', () => {
      mockServerBoardModel.board[cellIndex].value = 5; // Wrong value
      mockServerBoardModel.board[cellIndex].pupProgressSet = false;

      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(playerID, cellIndex);

      const gameStates = (gameState as unknown as {
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      const playerState = gameStates.get(playerID);
      expect(playerState?.gameState?.pupProgress).toBe(0);
      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });

    it('should increment PUP progress by 50 when golden objective is active', () => {
      mockServerBoardModel.board[cellIndex].value = 4;
      mockServerBoardModel.board[cellIndex].pupProgressSet = false;
      mockServerBoardModel.board[cellIndex].goldenObjectiveActive = true;

      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(playerID, cellIndex);

      const gameStates = (gameState as unknown as {
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      const playerState = gameStates.get(playerID);
      expect(playerState?.gameState?.pupProgress).toBe(70); // 20 + 50
      expect(mockServerBoardModel.board[cellIndex].goldenObjectiveActive).toBe(false);

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        false,
        [{ playerID, progress: 70 }]
      );
    });

    it('should clamp PUP progress to 100%', () => {
      // Set initial progress to 90
      const gameStates = (gameState as unknown as {
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      const playerState = gameStates.get(playerID);
      if (playerState?.gameState) {
        playerState.gameState.pupProgress = 90;
      }

      mockServerBoardModel.board[cellIndex].value = 4;
      mockServerBoardModel.board[cellIndex].pupProgressSet = false;
      mockServerBoardModel.board[cellIndex].goldenObjectiveActive = true;

      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(playerID, cellIndex);

      expect(playerState?.gameState?.pupProgress).toBe(100); // 90 + 20 + 50 = 160, clamped to 100

      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalledWith(
        false,
        [{ playerID, progress: 100 }]
      );
    });

    it('should not call callback when progress does not change', () => {
      mockServerBoardModel.board[cellIndex].value = 4;
      mockServerBoardModel.board[cellIndex].pupProgressSet = true; // Already set
      mockServerBoardModel.board[cellIndex].goldenObjectiveActive = false;

      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(playerID, cellIndex);

      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });

    it('should handle invalid player ID gracefully', () => {
      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(999, cellIndex);

      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });

    it('should handle player without gameState', () => {
      const gameStates = (gameState as unknown as {
        gameStates: Map<number, IPlayerState<ServerBoardModel>>
      }).gameStates;
      const playerState = gameStates.get(playerID);
      if (playerState) {
        delete playerState.gameState;
      }

      (gameState as unknown as { checkPUPProgress: (playerID: number, cellIndex: number) => void })
        .checkPUPProgress(playerID, cellIndex);

      expect(mockCallbacks.onProgressUpdate).not.toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete game flow', () => {
      // Add players
      expect(gameState.addPlayer(1)).toBe(true);
      expect(gameState.addPlayer(2)).toBe(true);

      // Initialize game
      const initialBoard = gameState.initGameStates();
      expect(initialBoard).toHaveLength(81);

      // Make moves
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockTimeService.updateLastActionTime.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(true);
      mockServerBoardModel.progress.mockReturnValue(50);

      const result = gameState.setCellValue(1, {
        clientTime: 1000,
        cellIndex: 0,
        value: 1,
        actionID: 1004
      });

      expect(result.result).toBe(true);
      expect(mockCallbacks.onProgressUpdate).toHaveBeenCalled();

      // Check solutions
      expect(gameState.getSolution(1, 0)).toBe(4); // First position in solution

      // Verify state hash
      expect(gameState.computeHash()).not.toBe(0);
    });

    it('should handle error recovery', () => {
      gameState.addPlayer(1);
      gameState.initGameStates();

      // First move fails
      mockTimeService.assessTiming.mockReturnValue(-1);
      let result = gameState.setCellValue(1, {
        clientTime: 1000,
        cellIndex: 0,
        value: 1,
        actionID: 1005
      });
      expect(result.result).toBe(false);

      // Second move succeeds
      mockTimeService.assessTiming.mockReturnValue(1001);
      mockTimeService.updateLastActionTime.mockReturnValue(1001);
      mockServerBoardModel.setCell.mockReturnValue(true);

      result = gameState.setCellValue(1, {
        clientTime: 1002,
        cellIndex: 1,
        value: 2,
        actionID: 1006
      });
      expect(result.result).toBe(true);
    });
  });
});
