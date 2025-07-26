import EnumHandler from "../EnumHandler";

import type LifecycleActions from "@shared/types/enums/actions/match/lifecycle";


export default class LifecycleHandler extends EnumHandler<LifecycleActions> {
  constructor() {
    super();

    const handlerMap = {};

    this.setHandlerMap(handlerMap);
  }
}