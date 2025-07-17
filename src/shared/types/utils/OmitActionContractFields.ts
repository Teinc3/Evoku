import type { ActionContractS2C, ActionContractC2S } from "../../types/contracts/base/ActionContract";
import type IDataContract from "@shared/types/contracts/base/IDataContract";


type OmitBaseActionFields<GenericContract extends IDataContract> = (
    GenericContract extends ActionContractS2C ? Omit<GenericContract, keyof ActionContractS2C>
    : GenericContract extends ActionContractC2S ? Omit<GenericContract, keyof ActionContractC2S>
    : GenericContract
)

export default OmitBaseActionFields;