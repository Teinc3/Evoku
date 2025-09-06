import {
  isEarthPUPActionsData, isFirePUPActionsData, isMetalPUPActionsData,
  isWaterPUPActionsData, isWoodPUPActionsData
} from "@shared/types/utils/typeguards/actions";
import UnionHandler from "../../../UnionHandler";
import WoodPUPHandler from "./WoodPUPHandler";
import WaterPUPHandler from "./WaterPUPHandler";
import MetalPUPHandler from "./MetalPUPHandler";
import FirePUPHandler from "./FirePUPHandler";
import EarthPUPHandler from "./EarthPUPHandler";

import type PUPActions from "@shared/types/enums/actions/match/player/powerups";
import type { SomeClientHandlerMapEntry } from "../../../../../types/networking";


export default class PUPHandler extends UnionHandler<PUPActions> {
  constructor() {
    const firePUPHandler = new FirePUPHandler();
    const waterPUPHandler = new WaterPUPHandler();
    const woodPUPHandler = new WoodPUPHandler();
    const metalPUPHandler = new MetalPUPHandler();
    const earthPUPHandler = new EarthPUPHandler();

    super([
      [isFirePUPActionsData, firePUPHandler],
      [isWaterPUPActionsData, waterPUPHandler],
      [isWoodPUPActionsData, woodPUPHandler],
      [isMetalPUPActionsData, metalPUPHandler],
      [isEarthPUPActionsData, earthPUPHandler]
    ] as SomeClientHandlerMapEntry<PUPActions>[]);
  }
}
