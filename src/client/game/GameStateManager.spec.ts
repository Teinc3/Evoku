import { MechanicsActions } from '@shared/types/enums/actions';
import GameStateManager from './GameStateManager';


describe('GameStateManager', () => {
  let gameState: GameStateManager;

  beforeEach(() => {
    gameState = new GameStateManager(2);
  });

  it('should be created', () => {
    expect(gameState).toBeTruthy();
  });

  it('should initially have zombie state', () => {
    expect(gameState.myID).toBe(0); // Zombie state defaults to player 0
    expect(gameState.getPlayerInfo(0)).toEqual({ playerID: 0, username: '' });
    expect(gameState.getPlayerInfo(1)).toEqual({ playerID: 1, username: '' });
  });

  it('should store and retrieve match data', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    gameState.createGame(mockMatchData);
    expect(gameState.myID).toBe(1);
  });

  it('should initialize player states when match data is set', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    gameState.createGame(mockMatchData);

    // Check that player states were created
    expect(gameState.getPlayerState(1)).toBeDefined();
    expect(gameState.getPlayerState(2)).toBeDefined();
    expect(gameState.getPlayerState(1)?.playerID).toBe(1);
    expect(gameState.getPlayerState(2)?.playerID).toBe(2);

    // Check that player info was stored
    expect(gameState.getPlayerInfo(1)).toEqual({ playerID: 1, username: 'Player1' });
    expect(gameState.getPlayerInfo(2)).toEqual({ playerID: 2, username: 'Player2' });
  });

  it('should return opponent information correctly', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    gameState.createGame(mockMatchData);
    const opponentInfo = gameState.getPlayerInfo(2);
    expect(opponentInfo).toEqual({
      playerID: 2,
      username: 'Player2'
    });
  });

  it('should return current player information correctly', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    gameState.createGame(mockMatchData);
    const myInfo = gameState.getPlayerInfo(1);
    expect(myInfo).toEqual({
      playerID: 1,
      username: 'Player1'
    });
  });

  it('should return zombie opponent info when no match data', () => {
    // With zombie state, opponent info is always available
    const opponentInfo = gameState.getPlayerInfo(1);
    expect(opponentInfo).toEqual({ playerID: 1, username: '' });
  });

  it('should clear match data and reset to zombie state', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    gameState.createGame(mockMatchData);
    expect(gameState.myID).toBe(1);
    expect(gameState.getPlayerInfo(1).username).toBe('Player1');

    gameState.clearMatchData();
    expect(gameState.myID).toBe(0); // Reset to zombie state
    expect(gameState.getPlayerInfo(0)).toEqual({ playerID: 0, username: '' });
    expect(gameState.getPlayerInfo(1)).toEqual({ playerID: 1, username: '' });
  });

  it('should add and remove players', () => {
    // Players 0 and 1 already exist in zombie state
    expect(gameState.addPlayer(0, 'Player0')).toBeFalse(); // Already exists
    expect(gameState.addPlayer(1, 'Player1')).toBeFalse(); // Already exists
    
    // Update existing player info
    gameState.playerInfo.get(0)!.username = 'Player0';
    expect(gameState.getPlayerInfo(0)).toEqual({ playerID: 0, username: 'Player0' });

    // Add a new player
    expect(gameState.addPlayer(2, 'Player2')).toBeTrue();
    expect(gameState.getPlayerState(2)).toBeDefined();
    expect(gameState.getPlayerState(2)?.playerID).toBe(2);
    expect(gameState.getPlayerInfo(2)).toEqual({ playerID: 2, username: 'Player2' });

    expect(gameState.removePlayer(2)).toBeTrue();
    expect(gameState.getPlayerState(2)).toBeUndefined();
    // Player info for 2 is removed, but zombie players 0 and 1 remain
    expect(gameState.getPlayerInfo(0)).toEqual({ playerID: 0, username: 'Player0' });
    expect(gameState.getPlayerInfo(1)).toEqual({ playerID: 1, username: '' });
  });

  it('should initialize game states with boards', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    const initialBoard = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    gameState.createGame(mockMatchData);
    gameState.initGameStates(initialBoard);

    const player1State = gameState.getPlayerState(1);
    const player2State = gameState.getPlayerState(2);

    expect(player1State?.gameState).toBeDefined();
    expect(player2State?.gameState).toBeDefined();
    expect(player1State?.gameState?.pupProgress).toBe(0);
    expect(player1State?.gameState?.powerups).toEqual([]);
    expect(player2State?.gameState?.pupProgress).toBe(0);
    expect(player2State?.gameState?.powerups).toEqual([]);
  });

  it('should store, retrieve, and clear pending actions', () => {
    const mockAction = {
      action: MechanicsActions.SET_CELL,
      actionID: 123,
      cellIndex: 5,
      value: 7,
      clientTime: Date.now()
    };

    // Initially empty
    expect(gameState.pendingActions.size).toBe(0);
    expect(gameState.pendingActions.get(123)).toBeUndefined();

    // Store action
    gameState.pendingActions.set(123, mockAction);
    expect(gameState.pendingActions.size).toBe(1);
    expect(gameState.pendingActions.get(123)).toEqual(mockAction);

    // Clear on match data clear
    gameState.clearMatchData();
    expect(gameState.pendingActions.size).toBe(0);
    expect(gameState.pendingActions.get(123)).toBeUndefined();
  });

  it('should delete a specific pending action', () => {
    const mockAction = {
      action: MechanicsActions.SET_CELL,
      actionID: 456,
      cellIndex: 10,
      value: 8,
      clientTime: performance.now()
    };

    gameState.pendingActions.set(456, mockAction);
    expect(gameState.pendingActions.has(456)).toBeTrue();

    gameState.pendingActions.delete(456);
    expect(gameState.pendingActions.has(456)).toBeFalse();
  });
});
