import EarthPUPActions from "@shared/types/enums/actions/match/player/powerups/earth";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class EarthPUPHandler extends EnumHandler<EarthPUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [EarthPUPActions.LANDSLIDE_USED]: this.handleLandslideUsed,
      [EarthPUPActions.EXCAVATE_USED]: this.handleExcavateUsed
    };

    this.setHandlerMap(handlerMap);
  }

  private handleLandslideUsed(_data: AugmentAction<EarthPUPActions>): void {
    console.debug('Client received: Earth Landslide powerup effect');
    // Handle client-side effects for earth landslide powerup
  }

  private handleExcavateUsed(_data: AugmentAction<EarthPUPActions>): void {
    console.debug('Client received: Earth Excavate powerup effect');
    // Handle client-side effects for earth excavate powerup
  }
}
