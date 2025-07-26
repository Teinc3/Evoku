import { 
  isMechanicsActionsData, isPUPActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../../UnionHandler";

import type PUPActions from "@shared/types/enums/actions/match/player/powerups";
import type MechanicsActions from "@shared/types/enums/actions/match/player/mechanics";
import type PlayerActions from "@shared/types/enums/actions/match/player";
import type { default as IDataHandler, SomeHandlerMapEntry } from "../../../types/handler";


export default class PlayerHandler extends UnionHandler<PlayerActions> {
  constructor(
    mechanicsHandler: IDataHandler<MechanicsActions>,
    pupHandler: IDataHandler<PUPActions>
  ) {
    super([
      [isMechanicsActionsData, mechanicsHandler],
      [isPUPActionsData, pupHandler]
    ] as SomeHandlerMapEntry<PlayerActions>[]);
  }
}