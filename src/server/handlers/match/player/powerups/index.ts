import { 
  isMechanicsActionsData, isPUPActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../../../UnionHandler";

import type PUPActions from "@shared/types/enums/actions/match/player/powerups/";
import type FirePUPActions from "@shared/types/enums/actions/match/player/powerups/fire";
import type WaterPUPActions from "@shared/types/enums/actions/match/player/powerups/water";
import type WoodPUPActions from "@shared/types/enums/actions/match/player/powerups/wood";
import type MetalPUPActions from "@shared/types/enums/actions/match/player/powerups/metal";
import type EarthPUPActions from "@shared/types/enums/actions/match/player/powerups/earth";
import type { 
  default as IDataHandler, SomeHandlerMapEntry
} from "../../../../types/handler";


export default class PUPHandler extends UnionHandler<PUPActions> {
  constructor(
    firePUPHandler: IDataHandler<FirePUPActions>,
    waterPUPHandler: IDataHandler<WaterPUPActions>,
    woodPUPHandler: IDataHandler<WoodPUPActions>,
    metalPUPHandler: IDataHandler<MetalPUPActions>,
    earthPUPHandler: IDataHandler<EarthPUPActions>
  ) {
    super([
      [isMechanicsActionsData, firePUPHandler],
      [isPUPActionsData, waterPUPHandler],
      [isPUPActionsData, woodPUPHandler],
      [isPUPActionsData, metalPUPHandler],
      [isPUPActionsData, earthPUPHandler]
    ] as SomeHandlerMapEntry<PUPActions>[]);
  }
}