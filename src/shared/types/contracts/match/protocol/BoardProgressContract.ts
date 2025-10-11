import type IDataContract from "../../components/base/IDataContract";


export default interface BoardProgressContract extends IDataContract {
  playerID: number;
  boardProgress: number;
}
