import type IDataContract from "../IDataContract";


export interface PingContract extends IDataContract {
  serverTime: number;
  clientPing: number;
}

export interface PongContract extends IDataContract {
  clientTime: number;
  serverTime: number;
}