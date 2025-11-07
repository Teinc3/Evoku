import WoodPUPActions from "./wood";
import WaterPUPActions from "./water";
import MetalPUPActions from "./metal";
import FirePUPActions from "./fire";
import EarthPUPActions from "./earth";


type PUPActions = 
  EarthPUPActions
  | FirePUPActions
  | WaterPUPActions
  | MetalPUPActions
  | WoodPUPActions;

export {
  WoodPUPActions,
  WaterPUPActions,
  MetalPUPActions,
  FirePUPActions,
  EarthPUPActions,
  type PUPActions as default,
  type PUPActions
}
