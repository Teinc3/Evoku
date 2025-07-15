import type ActionEnum from "../../enums/ActionEnum";


export default interface IDataContract {
    action: ActionEnum;
}

export type OmitAction<ContractMapping> = Omit<ContractMapping, 'action'>;