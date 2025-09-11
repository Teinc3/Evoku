import LobbyActions from '@shared/types/enums/actions/system/lobby';
import LobbyHandler from './LobbyHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';


describe('LobbyHandler', () => {
  let handler: LobbyHandler;

  beforeEach(() => {
    handler = new LobbyHandler();
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(LobbyHandler);
  });

  describe('handleQueueUpdate', () => {
    it('should handle QUEUE_UPDATE action', () => {
      spyOn(console, 'debug');

      const queueUpdateData: AugmentAction<LobbyActions.QUEUE_UPDATE> = {
        action: LobbyActions.QUEUE_UPDATE,
        inQueue: true
      };

      // Access private method for testing
      const privateHandler = handler['handleQueueUpdate'].bind(handler);
      privateHandler(queueUpdateData);

      expect(console.debug)
        .toHaveBeenCalledWith('Queue status updated with data:', queueUpdateData);
    });

    it('should handle QUEUE_UPDATE action with different data', () => {
      spyOn(console, 'debug');

      const queueUpdateData: AugmentAction<LobbyActions.QUEUE_UPDATE> = {
        action: LobbyActions.QUEUE_UPDATE,
        inQueue: false
      };

      const privateHandler = handler['handleQueueUpdate'].bind(handler);
      privateHandler(queueUpdateData);

      expect(console.debug)
        .toHaveBeenCalledWith('Queue status updated with data:', queueUpdateData);
    });
  });

  describe('handleMatchFound', () => {
    it('should handle MATCH_FOUND action', () => {
      spyOn(console, 'debug');

      const matchFoundData: AugmentAction<LobbyActions.MATCH_FOUND> = {
        action: LobbyActions.MATCH_FOUND,
        myID: 1,
        players: [
          { playerID: 1, username: 'Player1' },
          { playerID: 2, username: 'Player2' }
        ]
      };

      // Access private method for testing
      const privateHandler = handler['handleMatchFound'].bind(handler);
      privateHandler(matchFoundData);

      expect(console.debug).toHaveBeenCalledWith('Match found with data:', matchFoundData);
    });

    it('should handle MATCH_FOUND action with different player data', () => {
      spyOn(console, 'debug');

      const matchFoundData: AugmentAction<LobbyActions.MATCH_FOUND> = {
        action: LobbyActions.MATCH_FOUND,
        myID: 3,
        players: [
          { playerID: 3, username: 'TestPlayer' },
          { playerID: 4, username: 'Opponent' }
        ]
      };

      const privateHandler = handler['handleMatchFound'].bind(handler);
      privateHandler(matchFoundData);

      expect(console.debug).toHaveBeenCalledWith('Match found with data:', matchFoundData);
    });
  });

  describe('handleData integration', () => {
    it('should route QUEUE_UPDATE action to handleQueueUpdate', () => {
      spyOn(console, 'debug');

      const queueUpdateData: AugmentAction<LobbyActions.QUEUE_UPDATE> = {
        action: LobbyActions.QUEUE_UPDATE,
        inQueue: true
      };

      handler.handleData(queueUpdateData);

      expect(console.debug)
        .toHaveBeenCalledWith('Queue status updated with data:', queueUpdateData);
    });

    it('should route MATCH_FOUND action to handleMatchFound', () => {
      spyOn(console, 'debug');

      const matchFoundData: AugmentAction<LobbyActions.MATCH_FOUND> = {
        action: LobbyActions.MATCH_FOUND,
        myID: 1,
        players: [{ playerID: 1, username: 'Player1' }]
      };

      handler.handleData(matchFoundData);

      expect(console.debug).toHaveBeenCalledWith('Match found with data:', matchFoundData);
    });

    it('should handle errors in handler methods gracefully', () => {
      spyOn(console, 'error');
      spyOn(console, 'debug').and.throwError('Test error');

      const queueUpdateData: AugmentAction<LobbyActions.QUEUE_UPDATE> = {
        action: LobbyActions.QUEUE_UPDATE,
        inQueue: true
      };

      expect(() => handler.handleData(queueUpdateData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client handler for action ${LobbyActions.QUEUE_UPDATE}:`,
        jasmine.any(Error)
      );
    });
  });
});
