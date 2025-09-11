import MechanicsActions from "@shared/types/enums/actions/match/player/mechanics";
import EnumHandler from "../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class MechanicsHandler extends EnumHandler<MechanicsActions> {
  constructor() {
    super();

    const handlerMap = {
      [MechanicsActions.CELL_SET]: this.handleCellSet,
      [MechanicsActions.PUP_DRAWN]: this.handlePupDrawn,
    };

    this.setHandlerMap(handlerMap);
  }

  private handleCellSet(_data: AugmentAction<MechanicsActions.CELL_SET>): void {
    // Handle cell set by a player
    console.debug('Cell set by player');
  }

  private handlePupDrawn(_data: AugmentAction<MechanicsActions.PUP_DRAWN>): void {
    // Handle powerup drawn
    console.debug('Powerup drawn');
  }
}
