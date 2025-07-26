import EnumHandler from "../EnumHandler";

import type RoomModel from "src/server/models/Room";
import type LifecycleActions from "@shared/types/enums/actions/match/lifecycle";


export default class LifecycleHandler extends EnumHandler<LifecycleActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {};

    this.setHandlerMap(handlerMap);
  }
}