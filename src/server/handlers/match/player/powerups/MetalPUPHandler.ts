import MetalPUPActions from "@shared/types/enums/actions/match/player/powerups/metal";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../../models/networking/Session";
import type RoomModel from "../../../../models/networking/Room";


export default class MetalPUPHandler extends EnumHandler<MetalPUPActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {
      [MetalPUPActions.USE_LOCK]: this.handleUseLock,
      [MetalPUPActions.USE_FORGE]: this.handleUseForge
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseLock(_session: SessionModel, _data: AugmentAction<MetalPUPActions>): boolean {
    return true;
  }

  private handleUseForge(_session: SessionModel, _data: AugmentAction<MetalPUPActions>): boolean {
    return true;
  }
}