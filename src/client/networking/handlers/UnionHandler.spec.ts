import SessionActions from '@shared/types/enums/actions/system/session';
import LobbyActions from '@shared/types/enums/actions/system/lobby';
import UnionHandler from './UnionHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { 
  default as IClientDataHandler, SomeClientHandlerMapEntry 
} from '../../types/networking';


// Create concrete implementations for testing
class TestUnionHandler extends UnionHandler<SessionActions | LobbyActions> {}

class MockHandler implements IClientDataHandler<SessionActions | LobbyActions> {
  public handledData: AugmentAction<SessionActions | LobbyActions>[] = [];
  public shouldThrow = false;

  handleData(data: AugmentAction<SessionActions | LobbyActions>): void {
    if (this.shouldThrow) {
      throw new Error('Mock handler error');
    }
    this.handledData.push(data);
  }
}

describe('UnionHandler', () => {
  let handler: TestUnionHandler;
  let mockHandler1: MockHandler;
  let mockHandler2: MockHandler;
  let mockHandler3: MockHandler;

  // Type guards for testing
  const isHeartbeat = (
    data: AugmentAction<SessionActions | LobbyActions>
  ): data is AugmentAction<SessionActions.HEARTBEAT> => {
    return data.action === SessionActions.HEARTBEAT;
  };

  const isJoinQueue = (
    data: AugmentAction<SessionActions | LobbyActions>
  ): data is AugmentAction<LobbyActions.JOIN_QUEUE> => {
    return data.action === LobbyActions.JOIN_QUEUE;
  };

  const isLeaveQueue = (
    data: AugmentAction<SessionActions | LobbyActions>
  ): data is AugmentAction<LobbyActions.LEAVE_QUEUE> => {
    return data.action === LobbyActions.LEAVE_QUEUE;
  };

  beforeEach(() => {
    mockHandler1 = new MockHandler();
    mockHandler2 = new MockHandler();
    mockHandler3 = new MockHandler();

    const handlerMap: SomeClientHandlerMapEntry<SessionActions | LobbyActions>[] = [
      [isHeartbeat, mockHandler1],
      [isJoinQueue, mockHandler2],
      [isLeaveQueue, mockHandler3]
    ];

    handler = new TestUnionHandler(handlerMap);
  });

  it('should store handler map in constructor', () => {
    expect(handler).toBeDefined();
  });

  describe('handleData', () => {
    it('should route heartbeat data to first matching handler', () => {
      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      handler.handleData(heartbeatData);

      expect(mockHandler1.handledData).toContain(heartbeatData);
      expect(mockHandler2.handledData).toEqual([]);
      expect(mockHandler3.handledData).toEqual([]);
    });

    it('should route join queue data to second handler', () => {
      const joinQueueData: AugmentAction<LobbyActions.JOIN_QUEUE> = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'player123'
      };

      handler.handleData(joinQueueData);

      expect(mockHandler1.handledData).toEqual([]);
      expect(mockHandler2.handledData).toContain(joinQueueData);
      expect(mockHandler3.handledData).toEqual([]);
    });

    it('should stop at first matching handler', () => {
      // Create a handler map where multiple guards could match
      const mockHandler4 = new MockHandler();
      const alwaysTrueGuard = (
        data: AugmentAction<SessionActions | LobbyActions>
      ): data is AugmentAction<SessionActions.HEARTBEAT> => {
        return true; // This would match everything if it were first
      };

      const newHandlerMap: SomeClientHandlerMapEntry<SessionActions | LobbyActions>[] = [
        [isHeartbeat, mockHandler1],
        [alwaysTrueGuard, mockHandler4] // This should not be reached
      ];

      const testHandler = new TestUnionHandler(newHandlerMap);
      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      testHandler.handleData(heartbeatData);

      expect(mockHandler1.handledData).toContain(heartbeatData);
      expect(mockHandler4.handledData).toEqual([]);
    });

    it('should handle errors in sub-handlers gracefully', () => {
      spyOn(console, 'error');
      mockHandler1.shouldThrow = true;

      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      expect(() => handler.handleData(heartbeatData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client union handler for action ${SessionActions.HEARTBEAT}:`,
        jasmine.any(Error)
      );
    });

    it('should log warning when no handler is found', () => {
      spyOn(console, 'warn').and.callFake(() => {}); // Mute the warning

      const unknownData: AugmentAction<LobbyActions.QUEUE_UPDATE> = {
        action: LobbyActions.QUEUE_UPDATE,
        inQueue: true
      };

      handler.handleData(unknownData);

      expect(console.warn).toHaveBeenCalledWith(
        `No client handler found for action ${LobbyActions.QUEUE_UPDATE}`
      );
      expect(mockHandler1.handledData).toEqual([]);
      expect(mockHandler2.handledData).toEqual([]);
      expect(mockHandler3.handledData).toEqual([]);
    });

    it('should handle multiple non-matching type guards before finding a match', () => {
      const leaveQueueData: AugmentAction<LobbyActions.LEAVE_QUEUE> = {
        action: LobbyActions.LEAVE_QUEUE
      };

      handler.handleData(leaveQueueData);

      expect(mockHandler1.handledData).toEqual([]);
      expect(mockHandler2.handledData).toEqual([]);
      expect(mockHandler3.handledData).toContain(leaveQueueData);
    });

    it('should handle empty handler map', () => {
      spyOn(console, 'warn').and.callFake(() => {}); // Mute the warning

      const emptyHandler = new TestUnionHandler([]);
      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      emptyHandler.handleData(heartbeatData);

      expect(console.warn).toHaveBeenCalledWith(
        `No client handler found for action ${SessionActions.HEARTBEAT}`
      );
    });

    it('should handle completely invalid action numbers', () => {
      spyOn(console, 'warn').and.callFake(() => {}); // Mute the warning

      // Test with a completely invalid action number that doesn't exist in any enum
      const invalidData = {
        action: 999, // Invalid action number
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      } as unknown as AugmentAction<SessionActions | LobbyActions>;

      handler.handleData(invalidData);

      expect(console.warn).toHaveBeenCalledWith(
        `No client handler found for action ${invalidData.action}`
      );
      expect(mockHandler1.handledData).toEqual([]);
      expect(mockHandler2.handledData).toEqual([]);
      expect(mockHandler3.handledData).toEqual([]);
    });
  });
});
