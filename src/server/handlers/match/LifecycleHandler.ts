import EnumHandler from "../EnumHandler";

import type LifecycleActions from "@shared/types/enums/actions/match/lifecycle";
import type RoomModel from "../../models/Room";


export default class LifecycleHandler extends EnumHandler<LifecycleActions> {
  constructor(private readonly _room: RoomModel) {
    super();

    const handlerMap = {};

    this.setHandlerMap(handlerMap);
  }
}