import MechanicsActions from "@shared/types/enums/actions/match/player/mechanics";
import EnumHandler from "../../EnumHandler";

import type SessionModel from "src/server/models/Session";
import type RoomModel from "src/server/models/Room";
import type AugmentAction from "@shared/types/utils/AugmentAction";


export default class MechanicsHandler extends EnumHandler<MechanicsActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {
      [MechanicsActions.SET_CELL]: this.handleSetCell,
      [MechanicsActions.DRAW_PUP]: this.handleDrawPUP
    };

    this.setHandlerMap(handlerMap);
  }

  private handleSetCell(_session: SessionModel, _data: AugmentAction<MechanicsActions>): void {
    // Logic for handling set cell action
  }

  private handleDrawPUP(_session: SessionModel, _data: AugmentAction<MechanicsActions>): void {
    // Logic for handling draw PUP action
  }
}