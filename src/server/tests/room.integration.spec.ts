import { randomUUID, type UUID } from 'crypto';
import { jest } from '@jest/globals';

import ProtocolActions from '@shared/types/enums/actions/match/protocol';
import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import { RoomModel } from '../models/networking';
import { RoomManager } from '../managers';

import type { SessionModel } from '../models/networking';


jest.mock('../services/auth', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    updateElo: jest.fn().mockImplementation(() => Promise.resolve())
  }
}));

// Create a minimal mock of the SessionModel for this test's purposes.
// We need a UUID, a mutable `room` property, and a mockable `forward` method.
class MockSession {
  public room: RoomModel | null = null;
  public forward = jest.fn();
  constructor(public readonly uuid: string) {}
  public getElo() { return 1000; }
  public setElo(_elo: number) { /* mock */ }
}

const generateUUIDs = (): [UUID, UUID, UUID] => {
  return [randomUUID(), randomUUID(), randomUUID()];
}


describe('RoomManager and Room Integration Test', () => {
  let roomManager: RoomManager;

  beforeEach(() => {
    // Use fake timers to control setInterval
    jest.useFakeTimers();
    roomManager = new RoomManager();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should create a new room with a unique ID', () => {
    const room = roomManager.createRoom();
    expect(room).toBeInstanceOf(RoomModel);
    expect(room.roomID).toBeDefined();
    expect(room.roomID.length).toBe(5);
  });

  it('should allow adding multiple players to a room', () => {
    const room = roomManager.createRoom();
    const [uuid1, uuid2] = generateUUIDs();
    const session1 = new MockSession(uuid1) as unknown as SessionModel;
    const session2 = new MockSession(uuid2) as unknown as SessionModel;

    room.addPlayers([session1, session2]);

    expect(room.participants.size).toBe(2);
    expect(room.participants.get(uuid1)).toBe(session1);
    expect(session1.room).toBe(room);
    expect(session2.room).toBe(room);
  });

  it('should allow removing a player from a room', () => {
    const room = roomManager.createRoom();
    const [uuid1, uuid2] = generateUUIDs();
    const session1 = new MockSession(uuid1) as unknown as SessionModel;
    const session2 = new MockSession(uuid2) as unknown as SessionModel;
    room.addPlayers([session1, session2]);

    room.removeSession(session1);

    expect(room.participants.size).toBe(1);
    expect(room.participants.has(uuid1)).toBe(false);
    expect(session1.room).toBeNull();
    // Ensure the other session is unaffected
    expect(room.participants.get(uuid2)).toBe(session2);
  });

  it('should automatically clean up a room after all participants have left', () => {
    const room = roomManager.createRoom();
    const [uuid1] = generateUUIDs();
    const session1 = new MockSession(uuid1) as unknown as SessionModel;
    room.addPlayers([session1]);

    // Verify the room exists initially
    // @ts-expect-error ts(2341)
    expect(roomManager.rooms.has(room.roomID)).toBe(true);

    // Remove the last participant
    room.removeSession(session1);
    expect(room.participants.size).toBe(0);

    // Advance the timers to trigger the cleanup interval
    jest.advanceTimersByTime(10 * 60 * 1000 + 1); // 10 minutes

    // The room should now be removed from the manager
    // @ts-expect-error ts(2341)
    expect(roomManager.rooms.has(room.roomID)).toBe(false);
  });

  describe('Broadcast Functionality', () => {
    let room: RoomModel;
    let session1: MockSession, session2: MockSession, session3: MockSession;
    let uuid1: UUID, uuid2: UUID, uuid3: UUID;

    beforeEach(() => {
      room = roomManager.createRoom();
      [uuid1, uuid2, uuid3] = generateUUIDs();
      session1 = new MockSession(uuid1);
      session2 = new MockSession(uuid2);
      session3 = new MockSession(uuid3);
      room.addPlayers([session1, session2, session3] as unknown as SessionModel[]);
    });

    it('should broadcast a message to all participants by default', () => {
      room.broadcast(MechanicsActions.CELL_SET, {
        serverTime: 2145135,
        playerID: 0,
        actionID: 3,
        cellIndex: 9,
        value: 5
      });

      expect(session1.forward).toHaveBeenCalledTimes(1);
      expect(session2.forward).toHaveBeenCalledTimes(1);
      expect(session3.forward).toHaveBeenCalledTimes(1);
    });

    it('should exclude a single session from the broadcast', () => {
      room.broadcast(MechanicsActions.CELL_SET, {
        serverTime: 2145135,
        playerID: 1, // playerID for session2, I assume
        actionID: 3,
        cellIndex: 9,
        value: 5
      }, { exclude: new Set([session2.uuid]) as Set<UUID> });

      expect(session1.forward).toHaveBeenCalledTimes(1);
      expect(session2.forward).not.toHaveBeenCalled();
      expect(session3.forward).toHaveBeenCalledTimes(1);
    });

    it('should broadcast only to a specific list of session UUIDs', () => {
      room.broadcast(ProtocolActions.REJECT_ACTION, {
        actionID: 3,
        gameStateHash: 694208
      }, { to: [uuid1] });

      expect(session1.forward).toHaveBeenCalledTimes(1);
      expect(session2.forward).not.toHaveBeenCalled();
      expect(session3.forward).not.toHaveBeenCalled();
    });
  });
});
