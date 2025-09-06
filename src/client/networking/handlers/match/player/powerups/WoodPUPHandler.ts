import WoodPUPActions from "@shared/types/enums/actions/match/player/powerups/wood";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class WoodPUPHandler extends EnumHandler<WoodPUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [WoodPUPActions.ENTANGLE_USED]: this.handleEntangleUsed,
      [WoodPUPActions.WISDOM_USED]: this.handleWisdomUsed
    };

    this.setHandlerMap(handlerMap);
  }

  private handleEntangleUsed(_data: AugmentAction<WoodPUPActions>): void {
    console.debug('Client received: Wood Entangle powerup effect');
    // Handle client-side effects for wood entangle powerup
  }

  private handleWisdomUsed(_data: AugmentAction<WoodPUPActions>): void {
    console.debug('Client received: Wood Wisdom powerup effect');
    // Handle client-side effects for wood wisdom powerup
  }
}
