import type { ActionContractC2S, ActionContractS2C } from "../../extendables/ActionContract";
import type PUPContract from "../../extendables/PUPContract";
import type IDataContract from "../../IDataContract";


export interface DrawPupContract extends ActionContractC2S, IDataContract {}
// Add level info in the future
export interface PupDrawnContract extends PUPContract, ActionContractS2C, IDataContract {}