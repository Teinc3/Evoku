import type IDataContract from "../../components/base/IDataContract";


export interface PingContract extends IDataContract {
  serverTime: number;
  clientPing: number;
}

export interface PongContract extends IDataContract {
  clientTime: number;
  serverTime: number;
}
