import type PUPContract from "../../../../components/extendables/PUPContract";
import type {
  ActionContractC2S, ActionContractS2C
} from "../../../../components/extendables/ActionContract";
import type IDataContract from "../../../../components/base/IDataContract";


export default interface CascadeBaseContract extends PUPContract, IDataContract {}
export interface CascadeContractC2S extends CascadeBaseContract, ActionContractC2S {}
export interface CascadeContractS2C extends CascadeBaseContract, ActionContractS2C {}