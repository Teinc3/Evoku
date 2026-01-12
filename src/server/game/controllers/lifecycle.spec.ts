import MatchStatus from '@shared/types/enums/matchstatus';
import GameOverReason from '@shared/types/enums/GameOverReason';
import ProtocolActions from '@shared/types/enums/actions/match/protocol';
import { LifecycleActions } from '@shared/types/enums/actions';
import RatingCalculator from '../../utils/rating';
import guestAuthService from '../../services/auth';
import LifecycleController from './lifecycle';

import type { IPUPSlotState } from '@shared/types/gamestate/powerups';
import type { IMatchState } from '@shared/types/gamestate';
import type { RoomModel } from '../../models/networking';
import type GameStateController from './state';


// Mock Session for tests
class MockSession {
  public elo = 1000;
  constructor(public uuid: string) {}
  getElo = () => this.elo;
  setElo = (elo: number) => { this.elo = elo; };
}

// Mock dependencies
jest.mock('../../models/networking/room');
jest.mock('./state');
jest.mock('../../services/auth', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    updateElo: jest.fn().mockResolvedValue(undefined)
  }
}));

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
    
    // Mock RatingCalculator static methods
    jest.spyOn(RatingCalculator, 'calculateEloChange').mockReturnValue(40);
    jest.spyOn(RatingCalculator, 'calculateEloUpdate').mockReturnValue({
      newWinnerElo: 1040,
      newLoserElo: 960,
      eloChange: 40
    });
    
    // Setup room mock
    mockRoom = {
      participants: new Map([
        ['12345-67890-abcde-fghij-klmno', new MockSession('12345-67890-abcde-fghij-klmno')],
        ['54321-09876-edcba-jihgf-onmlk', new MockSession('54321-09876-edcba-jihgf-onmlk')],
        ['09876-54321-fedcb-abcde-onmlk', new MockSession('09876-54321-fedcb-abcde-onmlk')]
      ]),
      playerMap: {
        get: jest.fn().mockImplementation((uuid: string) => {
          if (uuid === '09876-54321-fedcb-abcde-onmlk') return 0;
          if (uuid === '12345-67890-abcde-fghij-klmno') return 1;
          if (uuid === '54321-09876-edcba-jihgf-onmlk') return 2;
          return undefined;
        }),
        set: jest.fn(),
        delete: jest.fn(),
        has: jest.fn(),
        getKey: jest.fn().mockImplementation((id: number) => {
          if (id === 0) return '09876-54321-fedcb-abcde-onmlk';
          if (id === 1) return '12345-67890-abcde-fghij-klmno';
          if (id === 2) return '54321-09876-edcba-jihgf-onmlk';
          return undefined;
        }),
        deleteValue: jest.fn(),
        hasValue: jest.fn()
      },
      timeService: mockTimeService,
      broadcast: jest.fn(),
      closeRoom: jest.fn(),
      clearTrackedTimeout: jest.fn()
    } as unknown as jest.Mocked<RoomModel>;
    
    // Setup game state mock
    mockGameState = {
      setCallbacks: jest.fn(),
      initGameStates: jest.fn().mockReturnValue([1, 2, 3, 4, 5]),
      addPlayer: jest.fn(),
      removePlayer: jest.fn(),
      setCellValue: jest.fn(),
      getSolution: jest.fn(),
      computeHash: jest.fn(),
      findPUPSlotByPupID: jest.fn(),
      getPlayerPowerups: jest.fn(),
      setPUPPendingEffect: jest.fn(),
      isObjectiveSolvedForCell: jest.fn(),
      matchState: { status: MatchStatus.PREINIT, phase: 0 }
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
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.PREINIT);
    });

    it('should set callbacks on game state controller', () => {
      expect(mockGameState.setCallbacks).toHaveBeenCalledWith(
        expect.objectContaining({
          onProgressUpdate: expect.any(Function)
        })
      );
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

    it('should handle game initialization failure gracefully', () => {
      // Mock initGameStates to throw an error
      mockGameState.initGameStates.mockImplementation(() => {
        throw new Error('Game initialization failed');
      });
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      lifecycleController.onPlayerJoined();
      
      // Fast-forward timer to trigger initialization
      jest.advanceTimersByTime(5000);
      
      // Should log error and set status to ENDED
      expect(consoleSpy).toHaveBeenCalledWith('Game initialization failed:', expect.any(Error));
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ENDED);
      
      consoleSpy.mockRestore();
    });
  });

  describe('onPlayerLeft', () => {
    it('should not process if status is ENDED', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Set status to ENDED by manually ending game
      lifecycleController.initGame();
      lifecycleController.close();
      
      lifecycleController.onPlayerLeft('12345-67890-abcde-fghij-klmno');
      
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should not process if exactly 2 players remain (branch coverage)', async () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // Set participants to 2
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([
          ['12345-67890-abcde-fghij-klmno', new MockSession('12345-67890-abcde-fghij-klmno')],
          ['54321-09876-edcba-jihgf-onmlk', new MockSession('54321-09876-edcba-jihgf-onmlk')]
        ]),
        writable: true
      });

      // Ensure we have exactly 2 players and status is not ENDED
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.PREINIT);
      expect(mockRoom.participants.size).toBe(2);
      
      await lifecycleController.onPlayerLeft('12345-67890-abcde-fghij-klmno');
      
      expect(clearTimeoutSpy).not.toHaveBeenCalled();
    });

    it('should process when status is not ENDED and players != 2 (full branch coverage)', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      // First set up a timer
      lifecycleController.onPlayerJoined();
      
      // Set up scenario where status is not ENDED and participants.size != 2
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.PREINIT);
      
      // Reduce to 1 player so participants.size !== 2
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([[
          '12345-67890-abcde-fghij-klmno',
          { uuid: '12345-67890-abcde-fghij-klmno' }
        ]]),
        writable: true
      });
      
      lifecycleController.onPlayerLeft('12345-67890-abcde-fghij-klmno');
      
      // Should process and clear timeout
      expect(clearTimeoutSpy).toHaveBeenCalled();
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
      
      lifecycleController.onPlayerLeft('12345-67890-abcde-fghij-klmno');
      
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should declare winner when one player remains', async () => {
      // Reduce to two players (one leaving, one remaining)
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([
          ['12345-67890-abcde-fghij-klmno', new MockSession('12345-67890-abcde-fghij-klmno')],
          ['09876-54321-fedcb-abcde-onmlk', new MockSession('09876-54321-fedcb-abcde-onmlk')]
        ]),
        writable: true
      });
      
      await lifecycleController.onPlayerLeft('09876-54321-fedcb-abcde-onmlk');
      
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        {
          winnerID: 1,
          reason: GameOverReason.FORFEIT,
          eloChange: 40
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
        lifecycleController.onPlayerLeft('99999-88888-77777-66666-55555');
      }).not.toThrow();
    });

    it('should return early if no remaining UUID can be determined', async () => {
      const leavingUUID = '11111-22222-33333-44444-55555';

      // Size=2 but both sessions report the same uuid as the leaving player.
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([
          ['a', new MockSession(leavingUUID)],
          ['b', new MockSession(leavingUUID)],
        ]),
        writable: true
      });

      await lifecycleController.onPlayerLeft(leavingUUID);

      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        expect.anything()
      );
    });

    it('should not end game if winnerID is undefined (exactly 2 players remain)', async () => {
      const leavingUUID = '11111-22222-33333-44444-55555';
      const remainingUUID = '66666-77777-88888-99999-00000';

      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([
          [leavingUUID, new MockSession(leavingUUID)],
          [remainingUUID, new MockSession(remainingUUID)],
        ]),
        writable: true
      });

      Object.defineProperty(mockRoom, 'playerMap', {
        value: {
          ...mockRoom.playerMap,
          get: jest.fn().mockReturnValue(undefined),
        },
        writable: true
      });

      await lifecycleController.onPlayerLeft(leavingUUID);

      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        expect.anything()
      );
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
      
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ONGOING);
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

  describe('onProgressUpdate callback', () => {
    let progressCallback: (
      isBoard: boolean,
      progressData: { playerID: number; progress: number }[]
    ) => Promise<void>;

    beforeEach(() => {
      const callbacks = mockGameState.setCallbacks.mock.calls[0][0];
      progressCallback = callbacks.onProgressUpdate;
    });

    it('should not process if status is not ONGOING', () => {
      const progressData = [{ playerID: 1, progress: 50 }];
      
      progressCallback(true, progressData);
      
      expect(mockRoom.broadcast).not.toHaveBeenCalled();
    });

    it('should trigger game over when player reaches 100% progress', async () => {
      lifecycleController.initGame(); // Set status to ONGOING
      
      const progressData = [{ playerID: 1, progress: 100 }];
      
      await progressCallback(true, progressData);
      
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        {
          winnerID: 1,
          reason: GameOverReason.SCORE,
          eloChange: 40
        }
      );
    });

    it('should not trigger game over for progress below 100%', () => {
      lifecycleController.initGame();
      
      const progressData = [{ playerID: 1, progress: 99 }];
      
      progressCallback(true, progressData);
      
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
      
      progressCallback(true, progressData);
      
      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        expect.anything()
      );
    });

    it('should trigger game over for first player reaching 100%', async () => {
      lifecycleController.initGame();
      
      const progressData = [
        { playerID: 0, progress: 95 },
        { playerID: 1, progress: 100 }
      ];
      
      await progressCallback(true, progressData);
      
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        {
          winnerID: 1,
          reason: GameOverReason.SCORE,
          eloChange: 40
        }
      );
    });

    it('should handle progress updates in TODO section (lines 95+)', () => {
      lifecycleController.initGame();
      
      const progressData = [
        { playerID: 1, progress: 50 }, // Between 33% and 100% - hits TODO section
        { playerID: 2, progress: 75 }  // Between 33% and 100% - hits TODO section
      ];
      
      const callbacks = mockGameState.setCallbacks.mock.calls[0][0];
      
      // This should reach the TODO section without triggering game over
      callbacks.onProgressUpdate(true, progressData);
      
      // Should not broadcast game over since progress < 100%
      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        expect.anything()
      );
    });

    it('should trigger phase transition when progress threshold is met', () => {
      lifecycleController.initGame();
      
      // Phase 0 -> 1 threshold is > 33.4%
      const progressData = [{ playerID: 1, progress: 35 }];
      
      progressCallback(true, progressData);
      
      expect(lifecycleController['stateController'].matchState.phase).toBe(1);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.PHASE_TRANSITION,
        { newPhase: 1 }
      );
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
      
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ENDED);
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

  describe('onGameOver edge cases', () => {
    it('should broadcast eloChange=0 if winner/loser sessions are missing', async () => {
      lifecycleController.initGame();

      // Ensure UUID lookups succeed, but sessions are missing from participants.
      Object.defineProperty(mockRoom, 'playerMap', {
        value: {
          ...mockRoom.playerMap,
          getKey: jest.fn().mockImplementation((id: number) => {
            if (id === 0) {
              return 'winner-uuid';
            }
            if (id === 1) {
              return 'loser-uuid';
            }
            return undefined;
          }),
        },
        writable: true
      });

      Object.defineProperty(mockRoom, 'participants', {
        value: new Map(),
        writable: true
      });

      await lifecycleController['onGameOver'](0, GameOverReason.SCORE);

      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        { winnerID: 0, reason: GameOverReason.SCORE, eloChange: 0 }
      );
    });

    it('should log error when ELO update fails and still broadcast', async () => {
      lifecycleController.initGame();

      (guestAuthService.updateElo as jest.MockedFunction<typeof guestAuthService.updateElo>)
        .mockRejectedValueOnce(new Error('Redis down'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await lifecycleController['onGameOver'](1, GameOverReason.SCORE);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to update ELO in Redis:',
        expect.anything()
      );
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        LifecycleActions.GAME_OVER,
        expect.objectContaining({ winnerID: 1, reason: GameOverReason.SCORE })
      );

      consoleSpy.mockRestore();
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
      
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ONGOING);
    });

    it('should handle timer interruption correctly', () => {
      lifecycleController.onPlayerJoined();
      
      // Interrupt timer by reducing to 2 players (one leaving)
      Object.defineProperty(mockRoom, 'participants', {
        value: new Map([
          ['12345-67890-abcde-fghij-klmno', {
            uuid: '12345-67890-abcde-fghij-klmno',
            getElo: jest.fn().mockReturnValue(1000),
            setElo: jest.fn()
          }],
          ['09876-54321-fedcb-abcde-onmlk', {
            uuid: '09876-54321-fedcb-abcde-onmlk',
            getElo: jest.fn().mockReturnValue(1000),
            setElo: jest.fn()
          }]
        ]),
        writable: true
      });
      lifecycleController.onPlayerLeft('09876-54321-fedcb-abcde-onmlk');
      
      // Timer should be cleared and game should be over (ENDED = 2)
      jest.advanceTimersByTime(5000);
      
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ENDED);
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
      lifecycleController.onPlayerLeft('12345-67890-abcde-fghij-klmno');
      
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.PREINIT);
    });

    it('should handle progress updates with invalid data', () => {
      lifecycleController.initGame();
      
      const callbacks = mockGameState.setCallbacks.mock.calls[0][0];
      
      expect(() => {
        callbacks.onProgressUpdate(true, []);
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
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.PREINIT);
      
      lifecycleController.initGame();
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ONGOING);
      
      lifecycleController.close();
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ENDED);
    });

    it('should prevent invalid status transitions', () => {
      lifecycleController.close();
      
      lifecycleController.initGame();
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ENDED);
    });

    it('should maintain status consistency', () => {
      lifecycleController.initGame();
      
      // Multiple init calls should not change status
      lifecycleController.initGame();
      lifecycleController.initGame();
      
      expect(lifecycleController['stateController'].matchState.status).toBe(MatchStatus.ONGOING);
    });
  });

  describe('Coverage Tests', () => {
    it('should not broadcast GAME_OVER if match is already ended', () => {
      // Set match status to ENDED
      (lifecycleController['stateController'].matchState as IMatchState).status = MatchStatus.ENDED;
  
      // Call onGameOver
      lifecycleController['onGameOver'](1, GameOverReason.SCORE);
  
      // Expect broadcast to NOT have been called
      expect(mockRoom.broadcast).not.toHaveBeenCalled();
    });
  
    it('should broadcast UPDATE_PROGRESS but not check for completion if isBoard is false', () => {
      // Set match status to ONGOING
      (
        lifecycleController['stateController'].matchState as IMatchState
      ).status = MatchStatus.ONGOING;
  
      const progressData = [{ playerID: 1, progress: 50 }];
      
      // Call updateProgress with isBoard = false
      lifecycleController['updateProgress'](false, progressData);
  
      // Expect broadcast to have been called
      expect(mockRoom.broadcast).toHaveBeenCalledWith(ProtocolActions.UPDATE_PROGRESS, {
        playerID: 1,
        isBoard: false,
        progress: 50
      });
    });
  });

  describe('onThreatExpired', () => {
    beforeEach(() => {
      lifecycleController.initGame(); // Set status to ONGOING
    });

    it('should return early if match status is not ONGOING', () => {
      (lifecycleController['stateController'].matchState as IMatchState).status = MatchStatus.ENDED;

      const timeoutId = setTimeout(() => {}, 1000);
      lifecycleController.onThreatExpired(0, 1, 1000, timeoutId);

      expect(mockGameState.findPUPSlotByPupID).not.toHaveBeenCalled();
    });

    it('should return early if slot is not found', () => {
      mockGameState.findPUPSlotByPupID.mockReturnValue(undefined);

      const timeoutId = setTimeout(() => {}, 1000);
      lifecycleController.onThreatExpired(0, 1, 1000, timeoutId);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should return early if pendingEffect is not set', () => {
      const mockSlot = { pup: {} } as unknown as IPUPSlotState;
      mockGameState.findPUPSlotByPupID.mockReturnValue(mockSlot);

      const timeoutId = setTimeout(() => {}, 1000);
      lifecycleController.onThreatExpired(0, 1, 1000, timeoutId);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should return early if timeoutId does not match', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const otherTimeoutId = setTimeout(() => {}, 2000);
      const mockSlot = {
        pup: { pendingEffect: { serverTimeoutID: otherTimeoutId } },
      } as unknown as IPUPSlotState;
      mockGameState.findPUPSlotByPupID.mockReturnValue(mockSlot);

      lifecycleController.onThreatExpired(0, 1, 1000, timeoutId);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should apply effect + clear pendingEffect if conditions are met', () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const pupID = 1;

      const slot = {
        pup: {
          pupID,
          pendingEffect: {
            serverTimeoutID: timeoutId,
            targetID: 1,
          },
        },
      } as unknown as IPUPSlotState;
      mockGameState.findPUPSlotByPupID.mockReturnValue(slot);

      lifecycleController.onThreatExpired(0, pupID, 1000, timeoutId);

      expect(mockRoom.broadcast).toHaveBeenCalledWith(LifecycleActions.APPLY_EFFECT, {
        serverTime: 1000,
        playerID: 0,
        targetID: 1,
        pupID,
      });
      expect(mockGameState.setPUPPendingEffect).toHaveBeenCalledWith(0, pupID, undefined);
      expect(slot.pup).toBeUndefined();
    });
  });

  describe('onCellSolved callback', () => {
    let cellSolvedCallback: (
      playerID: number, cellIndex: number, serverTime: number
    ) => Promise<void>;

    beforeEach(() => {
      lifecycleController.initGame(); // Set status to ONGOING
      const callbacks = mockGameState.setCallbacks.mock.calls[0][0];
      cellSolvedCallback = callbacks.onCellSolved;
    });

    it('should return early if match status is not ONGOING', async () => {
      (lifecycleController['stateController'].matchState as IMatchState).status = MatchStatus.ENDED;

      await cellSolvedCallback(0, 10, 1000);

      expect(mockGameState.getPlayerPowerups).not.toHaveBeenCalled();
    });

    it('should return early if opponent has no PUPs', async () => {
      mockGameState.getPlayerPowerups.mockReturnValue(undefined);

      await cellSolvedCallback(0, 10, 1000);

      expect(mockGameState.findPUPSlotByPupID).not.toHaveBeenCalled();
    });

    it('should skip slots without pup', async () => {
      const slot0 = { slotIndex: 0, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot1 = { slotIndex: 1, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot2 = { slotIndex: 2, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const mockSlots: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState]
        = [slot0, slot1, slot2];
      mockGameState.getPlayerPowerups.mockReturnValue(mockSlots);

      await cellSolvedCallback(0, 10, 1000);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should skip slots without pendingEffect', async () => {
      const slot0 = {
        slotIndex: 0,
        lastCooldownEnd: 0,
        locked: false,
        pup: { pupID: 1, type: 0, level: 1 }
      } as IPUPSlotState;
      const slot1 = { slotIndex: 1, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot2 = { slotIndex: 2, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const mockSlots: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState]
        = [slot0, slot1, slot2];
      mockGameState.getPlayerPowerups.mockReturnValue(mockSlots);

      await cellSolvedCallback(0, 10, 1000);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should skip if timeoutId is undefined', async () => {
      const slot0 = {
        slotIndex: 0,
        lastCooldownEnd: 2000,
        locked: false,
        pup: { pupID: 1, type: 0, level: 1, pendingEffect: { targetID: 0 } }
      } as IPUPSlotState;
      const slot1 = { slotIndex: 1, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot2 = { slotIndex: 2, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const mockSlots: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState] 
        = [slot0, slot1, slot2];
      mockGameState.getPlayerPowerups.mockReturnValue(mockSlots);

      await cellSolvedCallback(0, 10, 1000);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should skip if targetID does not match', async () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const slot0 = {
        slotIndex: 0,
        lastCooldownEnd: 2000,
        locked: false,
        pup: {
          pupID: 1,
          type: 0,
          level: 1,
          pendingEffect: { serverTimeoutID: timeoutId, targetID: 2 }
        }
      } as IPUPSlotState;
      const slot1 = { slotIndex: 1, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot2 = { slotIndex: 2, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const mockSlots: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState] 
        = [slot0, slot1, slot2];
      mockGameState.getPlayerPowerups.mockReturnValue(mockSlots);

      await cellSolvedCallback(0, 10, 1000);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should skip if serverTime is before lastCooldownEnd', async () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const slot0 = {
        slotIndex: 0,
        lastCooldownEnd: 500,
        locked: false,
        pup: {
          pupID: 1,
          type: 0,
          level: 1,
          pendingEffect: { serverTimeoutID: timeoutId, targetID: 0 }
        }
      } as IPUPSlotState;
      const slot1 = { slotIndex: 1, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot2 = { slotIndex: 2, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const mockSlots: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState] 
        = [slot0, slot1, slot2];
      mockGameState.getPlayerPowerups.mockReturnValue(mockSlots);

      await cellSolvedCallback(0, 10, 1000);

      expect(mockGameState.setPUPPendingEffect).not.toHaveBeenCalled();
    });

    it('should skip if objective is not solved for cell', async () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const slot0 = {
        slotIndex: 0,
        lastCooldownEnd: 2000,
        locked: false,
        pup: {
          pupID: 1,
          type: 0,
          level: 1,
          pendingEffect: { serverTimeoutID: timeoutId, targetID: 0 }
        }
      } as IPUPSlotState;
      const slot1 = { slotIndex: 1, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot2 = { slotIndex: 2, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const mockSlots: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState] 
        = [slot0, slot1, slot2];
      mockGameState.getPlayerPowerups.mockReturnValue(mockSlots);
      mockGameState.isObjectiveSolvedForCell.mockReturnValue(false);

      await cellSolvedCallback(0, 10, 1000);

      expect(mockRoom.clearTrackedTimeout).not.toHaveBeenCalled();
    });

    it('should clear timeout and apply effect if all conditions met', async () => {
      const timeoutId = setTimeout(() => {}, 1000);
      const pupID = 1;
      const slot0 = {
        slotIndex: 0,
        lastCooldownEnd: 2000,
        locked: false,
        pup: {
          pupID,
          type: 0,
          level: 1,
          pendingEffect: { serverTimeoutID: timeoutId, targetID: 0 }
        }
      } as IPUPSlotState;
      const slot1 = { slotIndex: 1, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const slot2 = { slotIndex: 2, lastCooldownEnd: 0, locked: false } as IPUPSlotState;
      const mockSlots: readonly [IPUPSlotState, IPUPSlotState, IPUPSlotState] 
        = [slot0, slot1, slot2];
      mockGameState.getPlayerPowerups.mockReturnValue(mockSlots);
      mockGameState.isObjectiveSolvedForCell.mockReturnValue(true);

      (lifecycleController['stateController'].matchState as IMatchState).status 
        = MatchStatus.ONGOING;

      await cellSolvedCallback(0, 10, 1000);

      expect(mockRoom.clearTrackedTimeout).toHaveBeenCalledWith(timeoutId);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(LifecycleActions.APPLY_EFFECT, {
        serverTime: 1000,
        playerID: 0,
        targetID: 0,
        pupID,
      });
      expect(mockSlots[0]?.pup).toBeUndefined();
    });
  });
});
