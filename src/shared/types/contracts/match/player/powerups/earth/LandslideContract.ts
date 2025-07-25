import type IDataContract from "../../../../components/base/IDataContract";
import type TargetContract from "../../../../components/extendables/TargetContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type CellIndexContract from "../../../../components/extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../../components/extendables/ActionContract";


export default interface LandslideBaseContract
  extends PUPContract, TargetContract, IDataContract {}
// Landslide is an rAOE powerup
export interface LandslideContractC2S extends LandslideBaseContract, ActionContractC2S {}
export interface LandslideContractS2C
  extends LandslideBaseContract, CellIndexContract, ActionContractS2C {}