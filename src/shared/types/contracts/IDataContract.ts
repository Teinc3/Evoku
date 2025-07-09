import type ActionType from "./ActionType";


export default interface IDataContract {
    action: ActionType;
}

export type OmitAction<ContractMapping> = Omit<ContractMapping, 'action'>;