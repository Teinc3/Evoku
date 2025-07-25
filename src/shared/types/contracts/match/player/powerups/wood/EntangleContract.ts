import type TargetContract from "../../../../components/extendables/TargetContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type {
  ActionContractC2S, ActionContractS2C
} from "../../../../components/extendables/ActionContract";
import type IDataContract from "../../../../components/base/IDataContract";


export default interface EntangleBaseContract extends PUPContract, TargetContract, IDataContract {}
export interface EntangleContractC2S extends EntangleBaseContract, ActionContractC2S {}
export interface EntangleContractS2C extends EntangleBaseContract, ActionContractS2C {}