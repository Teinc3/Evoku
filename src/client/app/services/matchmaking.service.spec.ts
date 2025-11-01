import { TestBed } from '@angular/core/testing';

import MatchmakingService from './matchmaking.service';

import type PlayerInfoContract from '@shared/types/contracts/components/custom/PlayerInfoContract';


describe('MatchmakingService', () => {
  let service: MatchmakingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MatchmakingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(service.playersInQueue()).toBe(0);
    expect(service.myPlayerID()).toBeNull();
    expect(service.players()).toEqual([]);
  });

  it('should update players in queue', () => {
    service.updatePlayersInQueue(5);
    expect(service.playersInQueue()).toBe(5);

    service.updatePlayersInQueue(10);
    expect(service.playersInQueue()).toBe(10);
  });

  it('should set match information', () => {
    const players: PlayerInfoContract[] = [
      { playerID: 0, username: 'Player1' },
      { playerID: 1, username: 'Player2' }
    ];

    service.setMatchInfo(0, players);

    expect(service.myPlayerID()).toBe(0);
    expect(service.players()).toEqual(players);
  });

  it('should clear match information', () => {
    const players: PlayerInfoContract[] = [
      { playerID: 0, username: 'Player1' },
      { playerID: 1, username: 'Player2' }
    ];

    service.setMatchInfo(0, players);
    service.updatePlayersInQueue(5);

    service.clearMatchInfo();

    expect(service.myPlayerID()).toBeNull();
    expect(service.players()).toEqual([]);
    expect(service.playersInQueue()).toBe(0);
  });

  it('should get opponent information in 1v1 match', () => {
    const players: PlayerInfoContract[] = [
      { playerID: 0, username: 'Player1' },
      { playerID: 1, username: 'Player2' }
    ];

    service.setMatchInfo(0, players);

    const opponent = service.getOpponent();
    expect(opponent).toBeTruthy();
    expect(opponent?.playerID).toBe(1);
    expect(opponent?.username).toBe('Player2');
  });

  it('should return null for opponent when not in a match', () => {
    const opponent = service.getOpponent();
    expect(opponent).toBeNull();
  });

  it('should return null for opponent when match has wrong number of players', () => {
    const players: PlayerInfoContract[] = [
      { playerID: 0, username: 'Player1' },
      { playerID: 1, username: 'Player2' },
      { playerID: 2, username: 'Player3' }
    ];

    service.setMatchInfo(0, players);

    const opponent = service.getOpponent();
    expect(opponent).toBeNull();
  });

  it('should get current player information', () => {
    const players: PlayerInfoContract[] = [
      { playerID: 0, username: 'Player1' },
      { playerID: 1, username: 'Player2' }
    ];

    service.setMatchInfo(0, players);

    const myInfo = service.getMyInfo();
    expect(myInfo).toBeTruthy();
    expect(myInfo?.playerID).toBe(0);
    expect(myInfo?.username).toBe('Player1');
  });

  it('should return null for current player when not in a match', () => {
    const myInfo = service.getMyInfo();
    expect(myInfo).toBeNull();
  });

  it('should handle player ID not found in players list', () => {
    const players: PlayerInfoContract[] = [
      { playerID: 1, username: 'Player2' },
      { playerID: 2, username: 'Player3' }
    ];

    service.setMatchInfo(0, players);

    const myInfo = service.getMyInfo();
    expect(myInfo).toBeNull();

    // In a 1v1, if the myID doesn't match any player, getOpponent will still return a player
    // But since it's not a valid match state, we expect it to return the first non-matching player
    const opponent = service.getOpponent();
    // This is actually valid behavior - it returns the first player found that isn't myID
    expect(opponent).toBeTruthy();
    expect(opponent?.playerID).toBe(1);
  });
});
