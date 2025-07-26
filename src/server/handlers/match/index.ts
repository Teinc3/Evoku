import { 
  isLifecycleActionsData, isPlayerActionsData, isProtocolActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../UnionHandler";

import type ProtocolActions from "@shared/types/enums/actions/match/protocol";
import type PlayerActions from "@shared/types/enums/actions/match/player";
import type LifecycleActions from "@shared/types/enums/actions/match/lifecycle";
import type MatchActions from "@shared/types/enums/actions/match";
import type { default as IDataHandler, SomeHandlerMapEntry } from "../../types/handler";


export default class MatchHandler extends UnionHandler<MatchActions> {
  constructor(
    lifecycleHandler: IDataHandler<LifecycleActions>,
    playerHandler: IDataHandler<PlayerActions>,
    protocolHandler: IDataHandler<ProtocolActions>
  ) {
    super([
      [isLifecycleActionsData, lifecycleHandler],
      [isPlayerActionsData, playerHandler],
      [isProtocolActionsData, protocolHandler]
    ] as SomeHandlerMapEntry<MatchActions>[]);
  }
}