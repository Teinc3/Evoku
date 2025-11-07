import { MatchStatus } from '../../types/enums';
import GameStateController from '.';

import type IPlayerState from '@shared/types/gamestate';
import type { 
  SetCellContract
} from '@shared/types/contracts/match/player/mechanics/SetCellContract';
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
  computeHash: jest.fn(() => 12345)
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
      getMatchStatus: jest.fn(() => MatchStatus.PREINIT),
      onBoardProgressUpdate: jest.fn()
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
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);

      const result = gameState.addPlayer(1);

      expect(result).toBe(true);
    });

    it('should reject player addition during ONGOING phase', () => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.ONGOING);

      const result = gameState.addPlayer(1);

      expect(result).toBe(false);
    });

    it('should reject player addition during ENDED phase', () => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.ENDED);

      const result = gameState.addPlayer(1);

      expect(result).toBe(false);
    });

    it('should handle multiple players', () => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);

      const result1 = gameState.addPlayer(1);
      const result2 = gameState.addPlayer(2);

      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });

  describe('removePlayer', () => {
    beforeEach(() => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
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
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.ONGOING);

      const result = gameState.removePlayer(1);
      expect(result).toBe(false);
    });
  });

  describe('setCallbacks', () => {
    it('should set callback functions', () => {
      const newCallbacks: GameLogicCallbacks = {
        getMatchStatus: jest.fn(() => MatchStatus.ONGOING),
        onBoardProgressUpdate: jest.fn()
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
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
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

      expect(mockCallbacks.onBoardProgressUpdate).toHaveBeenCalledWith([
        { playerID, progress: 75 }
      ]);
    });
  });

  describe('initGameStates', () => {
    beforeEach(() => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
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
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
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
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
      gameState.addPlayer(1);
      gameState.initGameStates(); // Initialize game states

      const hash = gameState.computeHash();
      expect(hash).not.toBe(0);
    });

    it('should return different hashes for different states', () => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
      gameState.addPlayer(1);
      gameState.initGameStates();
      const hash1 = gameState.computeHash();

      gameState.addPlayer(2);
      gameState.initGameStates(); // Re-initialize with new player
      const hash2 = gameState.computeHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should return consistent hash for same state', () => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
      gameState.addPlayer(1);

      const hash1 = gameState.computeHash();
      const hash2 = gameState.computeHash();

      expect(hash1).toBe(hash2);
    });
  });

  describe('progress tracking', () => {
    const playerID = 1;

    beforeEach(() => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
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

      expect(mockCallbacks.onBoardProgressUpdate).toHaveBeenCalledWith([
        { playerID, progress: 33 }
      ]);
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

      expect(mockCallbacks.onBoardProgressUpdate).toHaveBeenCalledWith([
        { playerID, progress: 100 }
      ]);
    });
  });

  describe('checkBoardProgresses (private method)', () => {
    beforeEach(() => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
      gameState.addPlayer(1);
      gameState.addPlayer(2);
      gameState.initGameStates();
    });

    it('should check progress for specific players when playerIDs provided', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Access private method via type assertion
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses([1]);

      expect(mockCallbacks.onBoardProgressUpdate).toHaveBeenCalledWith([
        { playerID: 1, progress: 45 }
      ]);
    });

    it('should check progress for all players when no playerIDs provided', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Access private method via type assertion
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses();

      expect(mockCallbacks.onBoardProgressUpdate).toHaveBeenCalledWith([
        { playerID: 1, progress: 45 },
        { playerID: 2, progress: 45 }
      ]);
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
      expect(mockCallbacks.onBoardProgressUpdate).not.toHaveBeenCalled();
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
      expect(mockCallbacks.onBoardProgressUpdate).not.toHaveBeenCalled();
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

      expect(mockCallbacks.onBoardProgressUpdate).not.toHaveBeenCalled();
    });

    it('should handle empty playerIDs array', () => {
      mockServerBoardModel.progress.mockReturnValue(45);
      
      // Access private method via type assertion
      (gameState as unknown as { checkBoardProgresses: (playerIDs?: number[]) => void })
        .checkBoardProgresses([]);

      expect(mockCallbacks.onBoardProgressUpdate).toHaveBeenCalledWith([
        { playerID: 1, progress: 45 },
        { playerID: 2, progress: 45 }
      ]);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete game flow', () => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);

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
      expect(mockCallbacks.onBoardProgressUpdate).toHaveBeenCalled();

      // Check solutions
      expect(gameState.getSolution(1, 0)).toBe(4); // First position in solution

      // Verify state hash
      expect(gameState.computeHash()).not.toBe(0);
    });

    it('should handle error recovery', () => {
      mockCallbacks.getMatchStatus.mockReturnValue(MatchStatus.PREINIT);
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
