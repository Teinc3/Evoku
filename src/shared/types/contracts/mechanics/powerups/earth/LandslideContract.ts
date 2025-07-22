import type IDataContract from "../../../IDataContract";
import type TargetContract from "../../../extendables/TargetContract";
import type PUPContract from "../../../extendables/PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface LandslideBaseContract
  extends PUPContract, TargetContract, IDataContract {}
// Landslide is an rAOE powerup
export interface LandslideContractC2S extends LandslideBaseContract, ActionContractC2S {}
export interface LandslideContractS2C
  extends LandslideBaseContract, CellIndexContract, ActionContractS2C {}