import FirePUPActions from "@shared/types/enums/actions/match/player/powerups/fire";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class FirePUPHandler extends EnumHandler<FirePUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [FirePUPActions.INFERNO_USED]: this.handleInfernoUsed,
      [FirePUPActions.METABOLIC_USED]: this.handleMetabolicUsed
    };

    this.setHandlerMap(handlerMap);
  }

  private handleInfernoUsed(_data: AugmentAction<FirePUPActions>): void {
    console.debug('Client received: Fire Inferno powerup effect');
    // Handle client-side effects for fire inferno powerup
  }

  private handleMetabolicUsed(_data: AugmentAction<FirePUPActions>): void {
    console.debug('Client received: Fire Metabolic powerup effect');
    // Handle client-side effects for fire metabolic powerup
  }
}
