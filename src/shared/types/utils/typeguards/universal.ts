import IDataContract from "@shared/types/contracts/base/IDataContract";

export default function universalContractGuard<GenericContract extends IDataContract>(
    action: GenericContract['action'],
    contract: IDataContract
): contract is GenericContract {
    return contract.action === action;
}