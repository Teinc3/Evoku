import type IDataContract from "../../components/base/IDataContract";


export default interface UpdateProgressContract extends IDataContract {
  playerID: number;
  isBoard: boolean;
  progress: number;
}
