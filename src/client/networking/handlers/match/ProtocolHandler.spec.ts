import ProtocolActions from '@shared/types/enums/actions/match/protocol';
import ProtocolHandler from './ProtocolHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type WebSocketService from '../../services/WebSocketService';


describe('ProtocolHandler', () => {
  let handler: ProtocolHandler;
  let mockWebSocketService: jasmine.SpyObj<WebSocketService>;

  beforeEach(() => {
    mockWebSocketService = jasmine.createSpyObj('WebSocketService', ['send']);
    handler = new ProtocolHandler(mockWebSocketService);
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(ProtocolHandler);
  });

  describe('handlePing', () => {
    it('should handle PING action', () => {
      const pingData: AugmentAction<ProtocolActions.PING> = {
        action: ProtocolActions.PING,
        serverTime: 12345,
        clientPing: 50
      };

      // Access private method for testing
      const privateHandler = handler['handlePing'].bind(handler);
      privateHandler(pingData);

      // The method currently doesn't do anything, so we just verify it doesn't throw
      expect(() => privateHandler(pingData)).not.toThrow();
    });

    it('should handle PING action with different timing data', () => {
      const pingData: AugmentAction<ProtocolActions.PING> = {
        action: ProtocolActions.PING,
        serverTime: 1234567900,
        clientPing: 75
      };

      const privateHandler = handler['handlePing'].bind(handler);
      privateHandler(pingData);

      expect(() => privateHandler(pingData)).not.toThrow();
    });
  });

  describe('handleRejectAction', () => {
    it('should handle REJECT_ACTION action', () => {
      spyOn(console, 'debug');

      const rejectData: AugmentAction<ProtocolActions.REJECT_ACTION> = {
        action: ProtocolActions.REJECT_ACTION,
        actionID: 100,
        gameStateHash: 12345
      };

      const privateHandler = handler['handleRejectAction'].bind(handler);
      privateHandler(rejectData);

      expect(console.debug).toHaveBeenCalledWith('Server rejected an action');
    });

    it('should handle REJECT_ACTION action with different data', () => {
      spyOn(console, 'debug');

      const rejectData: AugmentAction<ProtocolActions.REJECT_ACTION> = {
        action: ProtocolActions.REJECT_ACTION,
        actionID: 200,
        gameStateHash: 67890
      };

      const privateHandler = handler['handleRejectAction'].bind(handler);
      privateHandler(rejectData);

      expect(console.debug).toHaveBeenCalledWith('Server rejected an action');
    });
  });

  describe('handleData integration', () => {
    it('should route PING action to handlePing', () => {
      const pingData: AugmentAction<ProtocolActions.PING> = {
        action: ProtocolActions.PING,
        serverTime: 1234567890,
        clientPing: 50
      };

      handler.handleData(pingData);

      // Since handlePing doesn't do anything observable, we just verify it doesn't throw
      expect(() => handler.handleData(pingData)).not.toThrow();
    });

    it('should route REJECT_ACTION action to handleRejectAction', () => {
      spyOn(console, 'debug');

      const rejectData: AugmentAction<ProtocolActions.REJECT_ACTION> = {
        action: ProtocolActions.REJECT_ACTION,
        actionID: 100,
        gameStateHash: 12345
      };

      handler.handleData(rejectData);

      expect(console.debug).toHaveBeenCalledWith('Server rejected an action');
    });

    it('should handle errors in handler methods gracefully', () => {
      spyOn(console, 'error');
      spyOn(console, 'debug').and.throwError('Test error');

      const rejectData: AugmentAction<ProtocolActions.REJECT_ACTION> = {
        action: ProtocolActions.REJECT_ACTION,
        actionID: 100,
        gameStateHash: 12345
      };

      expect(() => handler.handleData(rejectData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client handler for action ${ProtocolActions.REJECT_ACTION}:`,
        jasmine.any(Error)
      );
    });
  });
});
