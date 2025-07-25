import type IDataContract from "../../../components/base/IDataContract";
import type PUPContract from "../../../components/extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../components/extendables/ActionContract";


export interface DrawPupContract extends ActionContractC2S, IDataContract {}
// Add level info in the future
export interface PupDrawnContract extends PUPContract, ActionContractS2C, IDataContract {}