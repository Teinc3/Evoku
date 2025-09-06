import EnumHandler from "../EnumHandler";

import type SessionActions from "@shared/types/enums/actions/system/session";


export default class SessionHandler extends EnumHandler<SessionActions> {
  constructor() {
    super();

    const handlerMap = {};

    this.setHandlerMap(handlerMap);
  }
}
