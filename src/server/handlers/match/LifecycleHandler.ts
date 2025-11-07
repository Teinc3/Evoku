import EnumHandler from "../EnumHandler";

import type LifecycleActions from "@shared/types/enums/actions/match/lifecycle";
import type { IMatchEnumHandler } from "../../types/handler"
import type { RoomModel } from "../../models/networking";


export default class LifecycleHandler extends EnumHandler<LifecycleActions>
  implements IMatchEnumHandler<LifecycleActions> {
  constructor(public readonly room: RoomModel) {
    super();

    const handlerMap = {};

    this.setHandlerMap(handlerMap);
  }
}