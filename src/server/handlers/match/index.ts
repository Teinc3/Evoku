import { 
  isLifecycleActionsData, isPlayerActionsData, isProtocolActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";
import ProtocolHandler from "./ProtocolHandler";
import PlayerHandler from "./player";
import LifecycleHandler from "./LifecycleHandler";

import type RoomModel from "src/server/models/Room";
import type MatchActions from "@shared/types/enums/actions/match";
import type { SomeHandlerMapEntry } from "../../types/handler";


export default class MatchHandler extends UnionHandler<MatchActions> {
  constructor(room: RoomModel) {
    const lifecycleHandler = new LifecycleHandler(room);
    const playerHandler = new PlayerHandler(room);
    const protocolHandler = new ProtocolHandler(room);

    super([
      [isLifecycleActionsData, lifecycleHandler],
      [isPlayerActionsData, playerHandler],
      [isProtocolActionsData, protocolHandler]
    ] as SomeHandlerMapEntry<MatchActions>[]);
  }
}