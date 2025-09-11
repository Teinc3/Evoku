import WaterPUPActions from '@shared/types/enums/actions/match/player/powerups/water';
import FirePUPActions from '@shared/types/enums/actions/match/player/powerups/fire';
import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import PlayerHandler from ".";

import type AugmentAction from '@shared/types/utils/AugmentAction';


describe('PlayerHandler', () => {
  let handler: PlayerHandler;

  beforeEach(() => {
    handler = new PlayerHandler();
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(PlayerHandler);
  });

  describe('handleData routing', () => {
    it('should route Mechanics CELL_SET action to MechanicsHandler', () => {
      spyOn(console, 'debug');

      const cellSetData: AugmentAction<MechanicsActions.CELL_SET> = {
        action: MechanicsActions.CELL_SET,
        cellIndex: 5,
        value: 1,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      handler.handleData(cellSetData);

      expect(console.debug).toHaveBeenCalledWith('Cell set by player');
    });

    it('should route Mechanics PUP_DRAWN action to MechanicsHandler', () => {
      spyOn(console, 'debug');

      const pupDrawnData: AugmentAction<MechanicsActions.PUP_DRAWN> = {
        action: MechanicsActions.PUP_DRAWN,
        pupID: 3,
        actionID: 150,
        serverTime: 1234567895,
        playerID: 1
      };

      handler.handleData(pupDrawnData);

      expect(console.debug).toHaveBeenCalledWith('Powerup drawn');
    });

    it('should route Fire INFERNO_USED action to PUPHandler', () => {
      spyOn(console, 'debug');

      const fireData: AugmentAction<FirePUPActions.INFERNO_USED> = {
        action: FirePUPActions.INFERNO_USED,
        pupID: 1,
        cellIndex: 5,
        targetID: 2,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      handler.handleData(fireData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Inferno powerup effect');
    });

    it('should route Water CASCADE_USED action to PUPHandler', () => {
      spyOn(console, 'debug');

      const waterData: AugmentAction<WaterPUPActions.CASCADE_USED> = {
        action: WaterPUPActions.CASCADE_USED,
        pupID: 4,
        actionID: 250,
        serverTime: 1234567910,
        playerID: 2
      };

      handler.handleData(waterData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Water Cascade powerup effect');
    });

    it('should handle errors in sub-handlers gracefully', () => {
      spyOn(console, 'error');
      spyOn(console, 'debug').and.throwError('Test error');

      const cellSetData: AugmentAction<MechanicsActions.CELL_SET> = {
        action: MechanicsActions.CELL_SET,
        cellIndex: 5,
        value: 1,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      expect(() => handler.handleData(cellSetData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client handler for action ${MechanicsActions.CELL_SET}:`,
        jasmine.any(Error)
      );
    });

    it('should stop at first matching type guard', () => {
      spyOn(console, 'debug');

      // Create a scenario where multiple type guards could match
      // This tests that the UnionHandler stops at the first match
      const cellSetData: AugmentAction<MechanicsActions.CELL_SET> = {
        action: MechanicsActions.CELL_SET,
        cellIndex: 5,
        value: 1,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      handler.handleData(cellSetData);

      // Should only call MechanicsHandler once
      expect(console.debug).toHaveBeenCalledTimes(1);
      expect(console.debug).toHaveBeenCalledWith('Cell set by player');
    });
  });
});
