import type PUPBaseContract from "../../../extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface EntangleBaseContract extends PUPBaseContract {}
export interface EntangleContractC2S extends EntangleBaseContract, ActionContractC2S {}
export interface EntangleContractS2C extends EntangleBaseContract, ActionContractS2C {}