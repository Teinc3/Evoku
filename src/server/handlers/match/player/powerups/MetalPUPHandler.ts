import MetalPUPActions from "@shared/types/enums/actions/match/player/powerups/metal";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../../models/Session";


export default class EarthPUPHandler extends EnumHandler<MetalPUPActions> {
  constructor() {
    super();

    const handlerMap = {
      [MetalPUPActions.USE_LOCK]: this.handleUseLock,
      [MetalPUPActions.USE_FORGE]: this.handleUseForge
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseLock(_session: SessionModel, _data: AugmentAction<MetalPUPActions>): void {
    // Logic for handling use lock action
  }

  private handleUseForge(_session: SessionModel, _data: AugmentAction<MetalPUPActions>): void {
    // Logic for handling use forge action
  }
}