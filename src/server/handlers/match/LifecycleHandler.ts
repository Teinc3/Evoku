import LifecycleActions from "@shared/types/enums/actions/match/lifecycle";
import EnumHandler from "../EnumHandler";


export default class LifecycleHandler extends EnumHandler<LifecycleActions> {
  constructor() {
    super();

    const handlerMap = {};

    this.setHandlerMap(handlerMap);
  }
}