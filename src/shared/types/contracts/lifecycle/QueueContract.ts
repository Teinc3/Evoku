import type IDataContract from "../IDataContract";


export interface JoinQueueContract extends IDataContract {
    username: string;
}

export interface LeaveQueueContract extends IDataContract {}

export interface QueueUpdateContract extends IDataContract {
    inQueue: boolean;
}