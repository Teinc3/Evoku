import WoodPUPActions from '@shared/types/enums/actions/match/player/powerups/wood';
import WaterPUPActions from '@shared/types/enums/actions/match/player/powerups/water';
import MetalPUPActions from '@shared/types/enums/actions/match/player/powerups/metal';
import FirePUPActions from '@shared/types/enums/actions/match/player/powerups/fire';
import EarthPUPActions from '@shared/types/enums/actions/match/player/powerups/earth';
import PUPHandler from ".";

import type AugmentAction from '@shared/types/utils/AugmentAction';


describe('PUPHandler', () => {
  let handler: PUPHandler;

  beforeEach(() => {
    handler = new PUPHandler();
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(PUPHandler);
  });

  describe('handleData routing', () => {
    it('should route Fire INFERNO_USED action to FirePUPHandler', () => {
      spyOn(console, 'debug');

      const fireData: AugmentAction<FirePUPActions.INFERNO_USED> = {
        action: FirePUPActions.INFERNO_USED,
        pupID: 1,
        cellIndex: 5,
        targetID: 2,
        actionID: 100,
        serverTime: 12345,
        playerID: 1
      };

      handler.handleData(fireData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Inferno powerup effect');
    });

    it('should route Fire METABOLIC_USED action to FirePUPHandler', () => {
      spyOn(console, 'debug');

      const fireData: AugmentAction<FirePUPActions.METABOLIC_USED> = {
        action: FirePUPActions.METABOLIC_USED,
        pupID: 2,
        actionID: 150,
        serverTime: 12345,
        playerID: 1
      };

      handler.handleData(fireData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Metabolic powerup effect');
    });

    it('should route Water CRYO_USED action to WaterPUPHandler', () => {
      spyOn(console, 'debug');

      const waterData: AugmentAction<WaterPUPActions.CRYO_USED> = {
        action: WaterPUPActions.CRYO_USED,
        pupID: 3,
        cellIndex: 8,
        targetID: 4,
        actionID: 200,
        serverTime: 324325,
        playerID: 2
      };

      handler.handleData(waterData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Water Cryo powerup effect');
    });

    it('should route Water CASCADE_USED action to WaterPUPHandler', () => {
      spyOn(console, 'debug');

      const waterData: AugmentAction<WaterPUPActions.CASCADE_USED> = {
        action: WaterPUPActions.CASCADE_USED,
        pupID: 4,
        actionID: 250,
        serverTime: 12513,
        playerID: 2
      };

      handler.handleData(waterData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Water Cascade powerup effect');
    });

    it('should route Earth powerup actions to EarthPUPHandler', () => {
      spyOn(console, 'debug');

      const earthData: AugmentAction<EarthPUPActions.LANDSLIDE_USED> = {
        action: EarthPUPActions.LANDSLIDE_USED,
        pupID: 5,
        actionID: 300,
        serverTime: 5426,
        playerID: 3,
        targetID: 2,
        cellIndex: 7,
      };

      handler.handleData(earthData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Earth Landslide powerup effect');
    });

    it('should route Metal powerup actions to MetalPUPHandler', () => {
      spyOn(console, 'debug');

      const metalData: AugmentAction<MetalPUPActions.LOCK_USED> = {
        action: MetalPUPActions.LOCK_USED,
        pupID: 6,
        value: 10,
        targetID: 2,
        actionID: 350,
        serverTime: 1234567930,
        playerID: 4
      };

      handler.handleData(metalData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Metal Lock powerup effect');
    });

    it('should route Wood powerup actions to WoodPUPHandler', () => {
      spyOn(console, 'debug');

      const woodData: AugmentAction<WoodPUPActions.ENTANGLE_USED> = {
        action: WoodPUPActions.ENTANGLE_USED,
        pupID: 7,
        targetID: 3,
        actionID: 400,
        serverTime: 1234567940,
        playerID: 5
      };

      handler.handleData(woodData);

      expect(console.debug).toHaveBeenCalledWith('Client received: Wood Entangle powerup effect');
    });

    it('should handle errors in sub-handlers gracefully', () => {
      spyOn(console, 'error');
      spyOn(console, 'debug').and.throwError('Test error');

      const fireData: AugmentAction<FirePUPActions.INFERNO_USED> = {
        action: FirePUPActions.INFERNO_USED,
        pupID: 1,
        cellIndex: 5,
        targetID: 2,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      expect(() => handler.handleData(fireData)).not.toThrow();
      expect(console.error).toHaveBeenCalledWith(
        `Error in client handler for action ${FirePUPActions.INFERNO_USED}:`,
        jasmine.any(Error)
      );
    });

    it('should stop at first matching type guard', () => {
      spyOn(console, 'debug');

      // Create a scenario where multiple type guards could match
      // This tests that the UnionHandler stops at the first match
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

      // Should only call FirePUPHandler once
      expect(console.debug).toHaveBeenCalledTimes(1);
      expect(console.debug).toHaveBeenCalledWith('Client received: Fire Inferno powerup effect');
    });
  });
});
