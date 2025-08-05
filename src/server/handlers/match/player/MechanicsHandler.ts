import MechanicsActions from "@shared/types/enums/actions/match/player/mechanics";
import EnumHandler from "../../EnumHandler";

import type AugmentAction from "@shared/types/utils/AugmentAction";
import type SessionModel from "../../../models/networking/Session";
import type RoomModel from "../../../models/networking/Room";


export default class MechanicsHandler extends EnumHandler<MechanicsActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {
      [MechanicsActions.SET_CELL]: this.handleSetCell,
      [MechanicsActions.DRAW_PUP]: this.handleDrawPUP
    };

    this.setHandlerMap(handlerMap);
  }

  private handleSetCell(_session: SessionModel, _data: AugmentAction<MechanicsActions>): boolean {
    return true;
  }

  private handleDrawPUP(_session: SessionModel, _data: AugmentAction<MechanicsActions>): boolean {
    return true;
  }
}