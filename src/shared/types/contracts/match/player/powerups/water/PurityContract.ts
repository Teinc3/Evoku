import type PUPContract from "../../../../components/extendables/PUPContract";
import type {
  ActionContractC2S, ActionContractS2C
} from "../../../../components/extendables/ActionContract";
import type IDataContract from "../../../../components/base/IDataContract";


export default interface PurityBaseContract extends PUPContract, IDataContract {}
export interface PurityContractC2S extends PurityBaseContract, ActionContractC2S {}
export interface PurityContractS2C extends PurityBaseContract, ActionContractS2C {}
