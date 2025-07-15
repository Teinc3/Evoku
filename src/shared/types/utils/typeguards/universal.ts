import IDataContract from "@shared/types/contracts/IDataContract";

export default function universalContractGuard<GenericContract extends IDataContract>(
    action: GenericContract['action'],
    contract: IDataContract
): contract is GenericContract {
    return contract.action === action;
}