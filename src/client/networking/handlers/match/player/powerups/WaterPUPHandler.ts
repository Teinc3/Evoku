import WaterPUPActions from "@shared/types/enums/actions/match/player/powerups/water";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class WaterPUPHandler extends EnumHandler<WaterPUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [WaterPUPActions.CRYO_USED]: this.handleCryoUsed,
      [WaterPUPActions.PURITY_USED]: this.handlePurityUsed
    };

    this.setHandlerMap(handlerMap);
  }

  private handleCryoUsed(_data: AugmentAction<WaterPUPActions>): void {
    console.debug('Client received: Water Cryo powerup effect');
    // Handle client-side effects for water cryo powerup
  }

  private handlePurityUsed(_data: AugmentAction<WaterPUPActions>): void {
    console.debug('Client received: Water Purity powerup effect');
    // Handle client-side effects for water purity powerup
  }
}
