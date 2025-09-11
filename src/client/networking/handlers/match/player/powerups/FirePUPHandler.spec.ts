import FirePUPActions from '@shared/types/enums/actions/match/player/powerups/fire';
import FirePUPHandler from './FirePUPHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';


describe('FirePUPHandler', () => {
  let handler: FirePUPHandler;

  beforeEach(() => {
    handler = new FirePUPHandler();
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(FirePUPHandler);
  });

  describe('handleInfernoUsed', () => {
    it('should handle INFERNO_USED action', () => {
      spyOn(console, 'debug');

      const infernoData: AugmentAction<FirePUPActions.INFERNO_USED> = {
        action: FirePUPActions.INFERNO_USED,
        pupID: 1,
        cellIndex: 5,
        targetID: 2,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      // Access private method for testing
      const privateHandler = handler['handleInfernoUsed'].bind(handler);
      privateHandler(infernoData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Inferno powerup effect');
    });

    it('should handle INFERNO_USED action with different data', () => {
      spyOn(console, 'debug');

      const infernoData: AugmentAction<FirePUPActions.INFERNO_USED> = {
        action: FirePUPActions.INFERNO_USED,
        pupID: 3,
        cellIndex: 12,
        targetID: 4,
        actionID: 200,
        serverTime: 1234567900,
        playerID: 2
      };

      const privateHandler = handler['handleInfernoUsed'].bind(handler);
      privateHandler(infernoData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Inferno powerup effect');
    });
  });

  describe('handleMetabolicUsed', () => {
    it('should handle METABOLIC_USED action', () => {
      spyOn(console, 'debug');

      const metabolicData: AugmentAction<FirePUPActions.METABOLIC_USED> = {
        action: FirePUPActions.METABOLIC_USED,
        pupID: 2,
        actionID: 150,
        serverTime: 1234567895,
        playerID: 1
      };

      const privateHandler = handler['handleMetabolicUsed'].bind(handler);
      privateHandler(metabolicData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Metabolic powerup effect');
    });

    it('should handle METABOLIC_USED action with different data', () => {
      spyOn(console, 'debug');

      const metabolicData: AugmentAction<FirePUPActions.METABOLIC_USED> = {
        action: FirePUPActions.METABOLIC_USED,
        pupID: 4,
        actionID: 250,
        serverTime: 1234567910,
        playerID: 3
      };

      const privateHandler = handler['handleMetabolicUsed'].bind(handler);
      privateHandler(metabolicData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Metabolic powerup effect');
    });
  });

  describe('handleData integration', () => {
    it('should route INFERNO_USED action to handleInfernoUsed', () => {
      spyOn(console, 'debug');

      const infernoData: AugmentAction<FirePUPActions.INFERNO_USED> = {
        action: FirePUPActions.INFERNO_USED,
        pupID: 1,
        cellIndex: 5,
        targetID: 2,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      handler.handleData(infernoData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Inferno powerup effect');
    });

    it('should route METABOLIC_USED action to handleMetabolicUsed', () => {
      spyOn(console, 'debug');

      const metabolicData: AugmentAction<FirePUPActions.METABOLIC_USED> = {
        action: FirePUPActions.METABOLIC_USED,
        pupID: 2,
        actionID: 150,
        serverTime: 1234567895,
        playerID: 1
      };

      handler.handleData(metabolicData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Metabolic powerup effect');
    });

    it('should handle errors in handler methods gracefully', () => {
      spyOn(console, 'error');
      spyOn(console, 'debug').and.throwError('Test error');

      const infernoData: AugmentAction<FirePUPActions.INFERNO_USED> = {
        action: FirePUPActions.INFERNO_USED,
        pupID: 1,
        cellIndex: 5,
        targetID: 2,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      expect(() => handler.handleData(infernoData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client handler for action ${FirePUPActions.INFERNO_USED}:`,
        jasmine.any(Error)
      );
    });
  });
});
