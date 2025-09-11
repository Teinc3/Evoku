import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import MechanicsHandler from './MechanicsHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';


describe('MechanicsHandler', () => {
  let handler: MechanicsHandler;

  beforeEach(() => {
    handler = new MechanicsHandler();
  });

  it('should be created successfully', () => {
    expect(handler).toBeDefined();
    expect(handler).toBeInstanceOf(MechanicsHandler);
  });

  describe('handleCellSet', () => {
    it('should handle CELL_SET action', () => {
      spyOn(console, 'debug');

      const cellSetData: AugmentAction<MechanicsActions.CELL_SET> = {
        action: MechanicsActions.CELL_SET,
        cellIndex: 5,
        value: 1,
        actionID: 100,
        serverTime: 1234567890,
        playerID: 1
      };

      // Access private method for testing
      const privateHandler = handler['handleCellSet'].bind(handler);
      privateHandler(cellSetData);

      expect(console.debug).toHaveBeenCalledWith('Cell set by player');
    });

    it('should handle CELL_SET action with different data', () => {
      spyOn(console, 'debug');

      const cellSetData: AugmentAction<MechanicsActions.CELL_SET> = {
        action: MechanicsActions.CELL_SET,
        cellIndex: 12,
        value: 0,
        actionID: 200,
        serverTime: 1234567900,
        playerID: 2
      };

      const privateHandler = handler['handleCellSet'].bind(handler);
      privateHandler(cellSetData);

      expect(console.debug).toHaveBeenCalledWith('Cell set by player');
    });
  });

  describe('handlePupDrawn', () => {
    it('should handle PUP_DRAWN action', () => {
      spyOn(console, 'debug');

      const pupDrawnData: AugmentAction<MechanicsActions.PUP_DRAWN> = {
        action: MechanicsActions.PUP_DRAWN,
        pupID: 3,
        actionID: 150,
        serverTime: 1234567895,
        playerID: 1
      };

      const privateHandler = handler['handlePupDrawn'].bind(handler);
      privateHandler(pupDrawnData);

      expect(console.debug).toHaveBeenCalledWith('Powerup drawn');
    });

    it('should handle PUP_DRAWN action with different data', () => {
      spyOn(console, 'debug');

      const pupDrawnData: AugmentAction<MechanicsActions.PUP_DRAWN> = {
        action: MechanicsActions.PUP_DRAWN,
        pupID: 7,
        actionID: 250,
        serverTime: 1234567910,
        playerID: 3
      };

      const privateHandler = handler['handlePupDrawn'].bind(handler);
      privateHandler(pupDrawnData);

      expect(console.debug).toHaveBeenCalledWith('Powerup drawn');
    });
  });

  describe('handleData integration', () => {
    it('should route CELL_SET action to handleCellSet', () => {
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

    it('should route PUP_DRAWN action to handlePupDrawn', () => {
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

    it('should handle errors in handler methods gracefully', () => {
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
  });
});
