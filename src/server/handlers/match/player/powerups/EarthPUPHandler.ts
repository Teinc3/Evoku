import EarthPUPActions from "@shared/types/enums/actions/match/player/powerups/earth";
import EnumHandler from "../../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../../models/Session";
import type RoomModel from "../../../../models/Room";


export default class EarthPUPHandler extends EnumHandler<EarthPUPActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {
      [EarthPUPActions.USE_LANDSLIDE]: this.handleUseLandslide,
      [EarthPUPActions.USE_EXCAVATE]: this.handleUseExcavate
    };

    this.setHandlerMap(handlerMap);
  }

  private handleUseLandslide(
    _session: SessionModel,
    _data: AugmentAction<EarthPUPActions>
  ): boolean {
    return true;
  }

  private handleUseExcavate(
    _session: SessionModel,
    _data: AugmentAction<EarthPUPActions>
  ): boolean {
    return true;
  }
}