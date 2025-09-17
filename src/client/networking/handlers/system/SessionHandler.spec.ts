import SessionActions from '@shared/types/enums/actions/system/session';
import SessionHandler from './SessionHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';


describe('SessionHandler', () => {
  let handler: SessionHandler;

  beforeEach(() => {
    handler = new SessionHandler();
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(SessionHandler);
  });

  describe('handleData integration', () => {
    it('should handle HEARTBEAT action', () => {
      // Mute warning for missing handler to avoid noisy test output
      spyOn(console, 'warn').and.stub();
      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT
      };

      expect(() => handler.handleData(heartbeatData)).not.toThrow();
    });

    it('should handle errors in handler methods gracefully', () => {
      spyOn(console, 'warn').and.callFake(() => {}); // Mute the warning

      // Test with an unknown action to trigger warning handling
      const unknownData = {
        action: -999
      };

      expect(() => handler.handleData(unknownData)).not.toThrow();
      expect(console.warn).toHaveBeenCalledWith('No client handler registered for action -999');
    });
  });
});
