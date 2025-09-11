import SessionActions from '@shared/types/enums/actions/system/session';
import LobbyActions from '@shared/types/enums/actions/system/lobby';
import EnumHandler from './EnumHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { default as IClientDataHandler, ClientHandlerMap } from '../../types/networking';


// Create concrete implementations for testing
class TestEnumHandler extends EnumHandler<SessionActions | LobbyActions> {}

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

describe('EnumHandler', () => {
  let handler: TestEnumHandler;
  let mockHeartbeatHandler: MockHandler;
  let mockJoinQueueHandler: MockHandler;
  let mockLeaveQueueHandler: MockHandler;

  beforeEach(() => {
    handler = new TestEnumHandler();
    mockHeartbeatHandler = new MockHandler();
    mockJoinQueueHandler = new MockHandler();
    mockLeaveQueueHandler = new MockHandler();
  });

  describe('setHandlerMap', () => {
    it('should store the handler map', () => {
      const handlerMap: ClientHandlerMap<SessionActions | LobbyActions> = {
        [SessionActions.HEARTBEAT]: mockHeartbeatHandler.handleData.bind(mockHeartbeatHandler),
        [LobbyActions.JOIN_QUEUE]: mockJoinQueueHandler.handleData.bind(mockJoinQueueHandler),
        [LobbyActions.LEAVE_QUEUE]: mockLeaveQueueHandler.handleData.bind(mockLeaveQueueHandler)
      };

      handler.setHandlerMap(handlerMap);

      // The handler map should be stored (we can't directly test private property,
      // but we can test that handleData works correctly)
      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      handler.handleData(heartbeatData);
      expect(mockHeartbeatHandler.handledData).toContain(heartbeatData);
    });

    it('should bind "this" context to handler functions', () => {
      const handlerMap: ClientHandlerMap<SessionActions | LobbyActions> = {
        [SessionActions.HEARTBEAT]: mockHeartbeatHandler.handleData.bind(mockHeartbeatHandler),
        [LobbyActions.JOIN_QUEUE]: mockJoinQueueHandler.handleData.bind(mockJoinQueueHandler)
      };

      handler.setHandlerMap(handlerMap);

      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      handler.handleData(heartbeatData);
      expect(mockHeartbeatHandler.handledData).toContain(heartbeatData);
    });

    it('should handle undefined/null handlers gracefully', () => {
      const handlerMap: ClientHandlerMap<SessionActions | LobbyActions> = {
        [SessionActions.HEARTBEAT]: mockHeartbeatHandler.handleData.bind(mockHeartbeatHandler),
        [LobbyActions.JOIN_QUEUE]: undefined, // Test undefined handler
      };

      handler.setHandlerMap(handlerMap);

      // Should not throw when setting undefined handlers
      expect(() => handler.setHandlerMap(handlerMap)).not.toThrow();
    });
  });

  describe('handleData', () => {
    beforeEach(() => {
      const handlerMap: ClientHandlerMap<SessionActions | LobbyActions> = {
        [SessionActions.HEARTBEAT]: mockHeartbeatHandler.handleData.bind(mockHeartbeatHandler),
        [LobbyActions.JOIN_QUEUE]: mockJoinQueueHandler.handleData.bind(mockJoinQueueHandler),
        [LobbyActions.LEAVE_QUEUE]: mockLeaveQueueHandler.handleData.bind(mockLeaveQueueHandler)
      };

      handler.setHandlerMap(handlerMap);
    });

    it('should call the correct handler for known actions', () => {
      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      handler.handleData(heartbeatData);

      expect(mockHeartbeatHandler.handledData).toContain(heartbeatData);
      expect(mockJoinQueueHandler.handledData).toEqual([]);
      expect(mockLeaveQueueHandler.handledData).toEqual([]);
    });

    it('should call join queue handler for JOIN_QUEUE action', () => {
      const joinQueueData: AugmentAction<LobbyActions.JOIN_QUEUE> = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'player123'
      };

      handler.handleData(joinQueueData);

      expect(mockHeartbeatHandler.handledData).toEqual([]);
      expect(mockJoinQueueHandler.handledData).toContain(joinQueueData);
      expect(mockLeaveQueueHandler.handledData).toEqual([]);
    });

    it('should call leave queue handler for LEAVE_QUEUE action', () => {
      const leaveQueueData: AugmentAction<LobbyActions.LEAVE_QUEUE> = {
        action: LobbyActions.LEAVE_QUEUE
      };

      handler.handleData(leaveQueueData);

      expect(mockHeartbeatHandler.handledData).toEqual([]);
      expect(mockJoinQueueHandler.handledData).toEqual([]);
      expect(mockLeaveQueueHandler.handledData).toContain(leaveQueueData);
    });

    it('should handle errors in handlers gracefully', () => {
      spyOn(console, 'error');
      mockHeartbeatHandler.shouldThrow = true;

      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      expect(() => handler.handleData(heartbeatData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client handler for action ${SessionActions.HEARTBEAT}:`,
        jasmine.any(Error)
      );
    });

    it('should log warning for unknown actions', () => {
      spyOn(console, 'warn');

      const unknownData: AugmentAction<LobbyActions.QUEUE_UPDATE> = {
        action: LobbyActions.QUEUE_UPDATE,
        inQueue: true
      };

      handler.handleData(unknownData);

      expect(console.warn).toHaveBeenCalledWith(
        `No client handler registered for action ${LobbyActions.QUEUE_UPDATE}`
      );
      expect(mockHeartbeatHandler.handledData).toEqual([]);
      expect(mockJoinQueueHandler.handledData).toEqual([]);
      expect(mockLeaveQueueHandler.handledData).toEqual([]);
    });

    it('should handle empty handler map', () => {
      spyOn(console, 'warn').and.callFake(() => {}); // Mute the warning

      const emptyHandler = new TestEnumHandler();
      // Initialize with empty handler map
      emptyHandler.setHandlerMap({});

      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      emptyHandler.handleData(heartbeatData);

      expect(console.warn).toHaveBeenCalledWith(
        `No client handler registered for action ${SessionActions.HEARTBEAT}`
      );
    });

    it('should handle undefined handler in map', () => {
      spyOn(console, 'warn').and.callFake(() => {}); // Mute the warning

      const handlerWithUndefined = new TestEnumHandler();
      const handlerMapWithUndefined: ClientHandlerMap<SessionActions | LobbyActions> = {
        [SessionActions.HEARTBEAT]: undefined
      };

      handlerWithUndefined.setHandlerMap(handlerMapWithUndefined);

      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      handlerWithUndefined.handleData(heartbeatData);

      expect(console.warn).toHaveBeenCalledWith(
        `No client handler registered for action ${SessionActions.HEARTBEAT}`
      );
    });

    it('should handle completely invalid action numbers', () => {
      spyOn(console, 'warn').and.callFake(() => {}); // Mute the warning

      // Test with a completely invalid action number that doesn't exist in any enum
      const invalidData = {
        action: 999, // Invalid action number
        pupID: 1,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      } as unknown as AugmentAction<SessionActions | LobbyActions>;

      handler.handleData(invalidData);

      expect(console.warn).toHaveBeenCalledWith(
        `No client handler registered for action ${invalidData.action}`
      );
      expect(mockHeartbeatHandler.handledData).toEqual([]);
      expect(mockJoinQueueHandler.handledData).toEqual([]);
      expect(mockLeaveQueueHandler.handledData).toEqual([]);
    });
  });
});
