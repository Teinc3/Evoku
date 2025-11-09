import type IDataContract from "../../components/base/IDataContract";


export interface JoinQueueContract extends IDataContract {
  username: string;
}

export interface LeaveQueueContract extends IDataContract {}

export interface QueueUpdateContract extends IDataContract {
  inQueue: boolean;
  onlineCount: number;
}
