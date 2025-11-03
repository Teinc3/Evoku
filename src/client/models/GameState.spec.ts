import GameStateModel from './GameState';


describe('GameStateModel', () => {
  let gameState: GameStateModel;

  beforeEach(() => {
    gameState = new GameStateModel();
  });

  it('should be created', () => {
    expect(gameState).toBeTruthy();
  });

  it('should initially have no match data', () => {
    expect(gameState.myID).toBeNull();
    expect(gameState.getPlayerInfo(1)).toBeNull();
    expect(gameState.getPlayerInfo(2)).toBeNull();
  });

  it('should store and retrieve match data', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    gameState.setMatchData(mockMatchData);
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

    gameState.setMatchData(mockMatchData);

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

    gameState.setMatchData(mockMatchData);
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

    gameState.setMatchData(mockMatchData);
    const myInfo = gameState.getPlayerInfo(1);
    expect(myInfo).toEqual({
      playerID: 1,
      username: 'Player1'
    });
  });

  it('should return null opponent info when no match data', () => {
    expect(gameState.getPlayerInfo(2)).toBeNull();
  });

  it('should clear match data and player states', () => {
    const mockMatchData = {
      myID: 1,
      players: [
        { playerID: 1, username: 'Player1' },
        { playerID: 2, username: 'Player2' }
      ]
    };

    gameState.setMatchData(mockMatchData);
    expect(gameState.myID).toBeTruthy();
    expect(gameState.getPlayerState(1)).toBeDefined();

    gameState.clearMatchData();
    expect(gameState.myID).toBeNull();
    expect(gameState.getPlayerInfo(1)).toBeNull();
    expect(gameState.getPlayerInfo(2)).toBeNull();
    expect(gameState.getPlayerState(1)).toBeUndefined();
    expect(gameState.getPlayerInfo(1)).toBeNull();
  });

  it('should add and remove players', () => {
    expect(gameState.addPlayer(1, 'Player1')).toBeTrue();
    expect(gameState.getPlayerState(1)).toBeDefined();
    expect(gameState.getPlayerState(1)?.playerID).toBe(1);
    expect(gameState.getPlayerInfo(1)).toEqual({ playerID: 1, username: 'Player1' });

    expect(gameState.addPlayer(1, 'Player1')).toBeFalse(); // Already exists

    expect(gameState.removePlayer(1)).toBeTrue();
    expect(gameState.getPlayerState(1)).toBeUndefined();
    expect(gameState.getPlayerInfo(1)).toBeNull();

    expect(gameState.removePlayer(1)).toBeFalse(); // Doesn't exist
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

    gameState.setMatchData(mockMatchData);
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
});