import LifecycleActions from '@shared/types/enums/actions/match/lifecycle';
import LifecycleHandler from './LifecycleHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';


describe('LifecycleHandler', () => {
  let handler: LifecycleHandler;

  beforeEach(() => {
    handler = new LifecycleHandler();
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(LifecycleHandler);
  });

  describe('handleGameInit', () => {
    it('should handle GAME_INIT action', () => {
      spyOn(console, 'debug');

      const gameInitData: AugmentAction<LifecycleActions.GAME_INIT> = {
        action: LifecycleActions.GAME_INIT,
        cellValues: [0, 1, 0, 1, 0]
      };

      // Access private method for testing
      const privateHandler = handler['handleGameInit'].bind(handler);
      privateHandler(gameInitData);

      expect(console.debug).toHaveBeenCalledWith('Game initialized');
    });

    it('should handle GAME_INIT action with different cell values', () => {
      spyOn(console, 'debug');

      const gameInitData: AugmentAction<LifecycleActions.GAME_INIT> = {
        action: LifecycleActions.GAME_INIT,
        cellValues: [1, 1, 0, 0, 1, 1]
      };

      const privateHandler = handler['handleGameInit'].bind(handler);
      privateHandler(gameInitData);

      expect(console.debug).toHaveBeenCalledWith('Game initialized');
    });
  });

  describe('handleGameOver', () => {
    it('should handle GAME_OVER action', () => {
      spyOn(console, 'debug');

      const gameOverData: AugmentAction<LifecycleActions.GAME_OVER> = {
        action: LifecycleActions.GAME_OVER,
        winnerID: 1,
        reason: 1 // Assuming 1 is a valid GameOverReason
      };

      const privateHandler = handler['handleGameOver'].bind(handler);
      privateHandler(gameOverData);

      expect(console.debug).toHaveBeenCalledWith('Game over');
    });

    it('should handle GAME_OVER action with different data', () => {
      spyOn(console, 'debug');

      const gameOverData: AugmentAction<LifecycleActions.GAME_OVER> = {
        action: LifecycleActions.GAME_OVER,
        winnerID: 2,
        reason: 2
      };

      const privateHandler = handler['handleGameOver'].bind(handler);
      privateHandler(gameOverData);

      expect(console.debug).toHaveBeenCalledWith('Game over');
    });
  });

  describe('handleData integration', () => {
    it('should route GAME_INIT action to handleGameInit', () => {
      spyOn(console, 'debug');

      const gameInitData: AugmentAction<LifecycleActions.GAME_INIT> = {
        action: LifecycleActions.GAME_INIT,
        cellValues: [0, 1, 0]
      };

      handler.handleData(gameInitData);

      expect(console.debug).toHaveBeenCalledWith('Game initialized');
    });

    it('should route GAME_OVER action to handleGameOver', () => {
      spyOn(console, 'debug');

      const gameOverData: AugmentAction<LifecycleActions.GAME_OVER> = {
        action: LifecycleActions.GAME_OVER,
        winnerID: 1,
        reason: 1
      };

      handler.handleData(gameOverData);

      expect(console.debug).toHaveBeenCalledWith('Game over');
    });

    it('should handle errors in handler methods gracefully', () => {
      spyOn(console, 'error');
      spyOn(console, 'debug').and.throwError('Test error');

      const gameInitData: AugmentAction<LifecycleActions.GAME_INIT> = {
        action: LifecycleActions.GAME_INIT,
        cellValues: [0, 1]
      };

      expect(() => handler.handleData(gameInitData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client handler for action ${LifecycleActions.GAME_INIT}:`,
        jasmine.any(Error)
      );
    });
  });
});
