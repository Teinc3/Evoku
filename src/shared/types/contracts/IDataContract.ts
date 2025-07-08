import type ActionType from "./ActionType";


export default interface IDataContract extends Record<string, any> {
    action: ActionType;
}