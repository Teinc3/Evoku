import MatchStatus from '../../types/enums/matchstatus';
import GameOverReason from '../../../shared/types/enums/GameOverReason';
import LifecycleActions from '../../../shared/types/enums/actions/match/lifecycle';
import LifecycleController from './lifecycle';

import type RoomModel from '../../models/networking/Room';
import type GameStateController from './state';


// Mock dependencies
jest.mock('../../models/networking/Room');
jest.mock('./state');

describe('LifecycleController', () => {
  let lifecycleController: LifecycleController;
  let mockRoom: jest.Mocked<RoomModel>;
  let mockGameState: jest.Mocked<GameStateController>;
  let mockTimeService: {
    start: jest.MockedFunction<() => void>;
    stop: jest.MockedFunction<() => void>;
    getTime: jest.MockedFunction<() => number>;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Setup time service mock
    mockTimeService = {
      start: jest.fn(),
      stop: jest.fn(),
      getTime: jest.fn().mockReturnValue(0)
    };
    
    // Setup room mock
    mockRoom = {
      participants: new Map([
        ['12345-67890-abcde-fghij-klmno', { uuid: '12345-67890-abcde-fghij-klmno', socket: {} }],
        ['54321-09876-edcba-jihgf-onmlk', { uuid: '54321-09876-edcba-jihgf-onmlk', socket: {} }]
      ]),
      playerMap: {
        get: jest.fn().mockImplementation((uuid: string) => {
          if (uuid === '12345-67890-abcde-fghij-klmno') return 1;
          if (uuid === '54321-09876-edcba-jihgf-onmlk') return 2;
          return undefined;
        }),
        set: jest.fn(),
        delete: jest.fn(),
        has: jest.fn(),
        getKey: jest.fn(),
        deleteValue: jest.fn(),
        hasValue: jest.fn()
      },
      timeService: mockTimeService,
      broadcast: jest.fn(),
      closeRoom: jest.fn()
    } as unknown as jest.Mocked<RoomModel>;
    
    // Setup game state mock
    mockGameState = {
      setCallbacks: jest.fn(),
      initGameStates: jest.fn().mockReturnValue([1, 2, 3, 4, 5]),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      setCellValue: jest.fn(),
      getSolution: jest.fn(),
      computeHash: jest.fn()
    } as unknown as jest.Mocked<GameStateController>;
    
    lifecycleController = new LifecycleController(mockRoom, mockGameState);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('constructor', () => {
    it('should create LifecycleController instance', () => {
      expect(lifecycleController).toBeDefined();
      expect(lifecycleController).toBeInstanceOf(LifecycleController);
    });

    it('should initialize with PREINIT status', () => {
      expect(lifecycleController.matchStatus).toBe(MatchStatus.PREINIT);
    });

    it('should set callbacks on game state controller', () => {
      expect(mockGameState.setCallbacks).toHaveBeenCalledWith(
        expect.objectContaining({
          getMatchStatus: expect.any(Function),
          onBoardProgressUpdate: expect.any(Function)
        })
      );
    });

    it('should provide match status through callback', () => {
      const callbacks = mockGameState.setCallbacks.mock.calls[0][0];
      
      expect(callbacks.getMatchStatus()).toBe(MatchStatus.PREINIT);
    });
  });

  describe('onPlayerJoined', () => {
    it('should not schedule game start with less than 2 players', () => {
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([[
          '12345-67890-abcde-fghij-klmno', 
          { uuid: '12345-67890-abcde-fghij-klmno' }
        ]]),
        writable: true
      });
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      lifecycleController.onPlayerJoined();
      
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should schedule game start with 2 players', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      lifecycleController.onPlayerJoined();
      
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should not schedule multiple timers', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      lifecycleController.onPlayerJoined();
      lifecycleController.onPlayerJoined();
      
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
    });

    it('should not schedule if status is not PREINIT', () => {
      // Manually start game to change status
      lifecycleController.initGame();
      
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      lifecycleController.onPlayerJoined();
      
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should trigger game initialization after timer', () => {
      const initGameSpy = jest.spyOn(lifecycleController, 'initGame');
      
      lifecycleController.onPlayerJoined();
      
      // Fast-forward timer
      jest.advanceTimersByTime(5000);
      
      expect(initGameSpy).toHaveBeenCalled();
    });
  });

  describe('onPlayerLeft', () => {
    it('should not process if status is ENDED', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Set status to ENDED by manually ending game
      lifecycleController.initGame();
      lifecycleController.close();
      
      lifecycleController.onPlayerLeft();
      
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should not process if 2 players remain', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      lifecycleController.onPlayerLeft();
      
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should clear start timer if player leaves', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Set up timer
      lifecycleController.onPlayerJoined();
      
      // Reduce player count
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([[
          '12345-67890-abcde-fghij-klmno',
          { uuid: '12345-67890-abcde-fghij-klmno' }
        ]]),
        writable: true
      });
      
      lifecycleController.onPlayerLeft();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should declare winner when one player remains', () => {
      // Reduce to one player
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([[
          '12345-67890-abcde-fghij-klmno',
          { uuid: '12345-67890-abcde-fghij-klmno' }
        ]]),
        writable: true
      });
      
      lifecycleController.onPlayerLeft();
      
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        {
          winnerID: 1,
          reason: GameOverReason.FORFEIT
        }
      );
    });

    it('should handle missing player mapping gracefully', () => {
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([[
          '99999-88888-77777-66666-55555',
          { uuid: '99999-88888-77777-66666-55555' }
        ]]),
        writable: true
      });
      Object.defineProperty(mockRoom, 'playerMap', {
        value: { get: jest.fn().mockReturnValue(undefined) },
        writable: true
      });
      
      expect(() => {
        lifecycleController.onPlayerLeft();
      }).not.toThrow();
    });
  });

  describe('initGame', () => {
    it('should not initialize if status is not PREINIT', () => {
      lifecycleController.initGame();
      
      // Try to init again
      lifecycleController.initGame();
      
      expect(mockGameState.initGameStates).toHaveBeenCalledTimes(1);
    });

    it('should update status to ONGOING', () => {
      lifecycleController.initGame();
      
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ONGOING);
    });

    it('should start time service', () => {
      lifecycleController.initGame();
      
      expect(mockTimeService.start).toHaveBeenCalled();
    });

    it('should initialize game states', () => {
      lifecycleController.initGame();
      
      expect(mockGameState.initGameStates).toHaveBeenCalled();
    });

    it('should broadcast game initialization', () => {
      lifecycleController.initGame();
      
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_INIT,
        { cellValues: [1, 2, 3, 4, 5] }
      );
    });

    it('should handle init game states error gracefully', () => {
      mockGameState.initGameStates.mockImplementation(() => {
        throw new Error('Init failed');
      });
      
      expect(() => {
        lifecycleController.initGame();
      }).toThrow('Init failed');
    });
  });

  describe('onBoardProgressUpdate callback', () => {
    let progressCallback: (progressData: { playerID: number; progress: number }[]) => void;

    beforeEach(() => {
      const callbacks = mockGameState.setCallbacks.mock.calls[0][0];
      progressCallback = callbacks.onBoardProgressUpdate;
    });

    it('should not process if status is not ONGOING', () => {
      const progressData = [{ playerID: 1, progress: 50 }];
      
      progressCallback(progressData);
      
      expect(mockRoom.broadcast).not.toHaveBeenCalled();
    });

    it('should trigger game over when player reaches 100% progress', () => {
      lifecycleController.initGame(); // Set status to ONGOING
      
      const progressData = [{ playerID: 1, progress: 100 }];
      
      progressCallback(progressData);
      
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        {
          winnerID: 1,
          reason: GameOverReason.SCORE
        }
      );
    });

    it('should not trigger game over for progress below 100%', () => {
      lifecycleController.initGame();
      
      const progressData = [{ playerID: 1, progress: 99 }];
      
      progressCallback(progressData);
      
      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        expect.anything()
      );
    });

    it('should handle multiple players with different progress', () => {
      lifecycleController.initGame();
      
      const progressData = [
        { playerID: 1, progress: 50 },
        { playerID: 2, progress: 75 }
      ];
      
      progressCallback(progressData);
      
      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        expect.anything()
      );
    });

    it('should trigger game over for first player reaching 100%', () => {
      lifecycleController.initGame();
      
      const progressData = [
        { playerID: 1, progress: 100 },
        { playerID: 2, progress: 95 }
      ];
      
      progressCallback(progressData);
      
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        {
          winnerID: 1,
          reason: GameOverReason.SCORE
        }
      );
    });

    it('should handle empty progress data', () => {
      lifecycleController.initGame();
      
      expect(() => {
        progressCallback([]);
      }).not.toThrow();
    });
  });

  describe('close', () => {
    it('should clear start timer if active', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      lifecycleController.onPlayerJoined();
      lifecycleController.close();
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should set status to ENDED', () => {
      lifecycleController.close();
      
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ENDED);
    });

    it('should handle close when no timer is active', () => {
      expect(() => {
        lifecycleController.close();
      }).not.toThrow();
    });

    it('should prevent further operations after close', () => {
      lifecycleController.close();
      
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      lifecycleController.onPlayerJoined();
      
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });
  });

  describe('timer management', () => {
    it('should handle timer operations correctly', () => {
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      lifecycleController.onPlayerJoined();
      expect(setTimeoutSpy).toHaveBeenCalled();
      
      lifecycleController.close();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle timer completion correctly', () => {
      lifecycleController.onPlayerJoined();
      
      // Fast-forward timer
      jest.advanceTimersByTime(5000);
      
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ONGOING);
    });

    it('should handle timer interruption correctly', () => {
      lifecycleController.onPlayerJoined();
      
      // Interrupt timer by reducing to 1 player (which should clear timer and trigger game over)
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([[
          '12345-67890-abcde-fghij-klmno',
          { uuid: '12345-67890-abcde-fghij-klmno' }
        ]]),
        writable: true
      });
      lifecycleController.onPlayerLeft();
      
      // Timer should be cleared and game should be over (ENDED = 2)
      jest.advanceTimersByTime(5000);
      
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ENDED);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle missing game state gracefully', () => {
      expect(() => {
        new LifecycleController(mockRoom, null as unknown as GameStateController);
      }).toThrow();
    });

    it('should handle concurrent operations', () => {
      lifecycleController.onPlayerJoined();
      lifecycleController.onPlayerJoined();
      lifecycleController.onPlayerLeft();
      
      expect(lifecycleController.matchStatus).toBe(MatchStatus.PREINIT);
    });

    it('should handle progress updates with invalid data', () => {
      lifecycleController.initGame();
      
      const callbacks = mockGameState.setCallbacks.mock.calls[0][0];
      
      expect(() => {
        callbacks.onBoardProgressUpdate([]);
      }).not.toThrow();
    });

    it('should handle broadcast errors gracefully', () => {
      mockRoom.broadcast.mockImplementation(() => {
        throw new Error('Broadcast failed');
      });
      
      expect(() => {
        lifecycleController.initGame();
      }).toThrow('Broadcast failed');
    });
  });

  describe('status transitions', () => {
    it('should follow correct status progression', () => {
      expect(lifecycleController.matchStatus).toBe(MatchStatus.PREINIT);
      
      lifecycleController.initGame();
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ONGOING);
      
      lifecycleController.close();
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ENDED);
    });

    it('should prevent invalid status transitions', () => {
      lifecycleController.close();
      
      lifecycleController.initGame();
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ENDED);
    });

    it('should maintain status consistency', () => {
      lifecycleController.initGame();
      
      // Multiple init calls should not change status
      lifecycleController.initGame();
      lifecycleController.initGame();
      
      expect(lifecycleController.matchStatus).toBe(MatchStatus.ONGOING);
    });
  });
});
