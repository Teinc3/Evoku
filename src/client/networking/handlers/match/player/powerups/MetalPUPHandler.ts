import MetalPUPActions from "@shared/types/enums/actions/match/player/powerups/metal";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class MetalPUPHandler extends EnumHandler<MetalPUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [MetalPUPActions.LOCK_USED]: this.handleLockUsed,
      [MetalPUPActions.FORGE_USED]: this.handleForgeUsed
    };

    this.setHandlerMap(handlerMap);
  }

  private handleLockUsed(_data: AugmentAction<MetalPUPActions>): void {
    console.debug('Client received: Metal Lock powerup effect');
    // Handle client-side effects for metal lock powerup
  }

  private handleForgeUsed(_data: AugmentAction<MetalPUPActions>): void {
    console.debug('Client received: Metal Forge powerup effect');
    // Handle client-side effects for metal forge powerup
  }
}
