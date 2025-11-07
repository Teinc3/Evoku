import ActionGuard from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";
import ProtocolHandler from "./ProtocolHandler";
import PlayerHandler from "./player";
import LifecycleHandler from "./LifecycleHandler";

import type { MatchActions } from "@shared/types/enums/actions";
import type { SomeHandlerMapEntry } from "../../types/handler";
import type { RoomModel } from "../../models/networking";


export default class MatchHandler extends UnionHandler<MatchActions> {
  constructor(room: RoomModel) {
    const lifecycleHandler = new LifecycleHandler(room);
    const playerHandler = new PlayerHandler(room);
    const protocolHandler = new ProtocolHandler(room);

    super([
      [ActionGuard.isLifecycleActionsData, lifecycleHandler],
      [ActionGuard.isPlayerActionsData, playerHandler],
      [ActionGuard.isProtocolActionsData, protocolHandler]
    ] as SomeHandlerMapEntry<MatchActions>[]);
  }
}