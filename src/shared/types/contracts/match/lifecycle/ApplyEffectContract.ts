import type { ActionContractS2C } from "../../components/extendables/ActionContract";
import type IDataContract from "../../components/base/IDataContract";
import type { PUPContract } from "../../components";


export default interface ApplyEffectContract
  extends Omit<ActionContractS2C, 'actionID'>, PUPContract, IDataContract {
  targetID: number;
}
