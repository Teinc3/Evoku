import type IDataContract from "../../components/base/IDataContract";
import type GameOverReason from "../../../../types/enums/GameOverReason";


export default interface GameOverContract extends IDataContract {
  winnerID: number;
  reason: GameOverReason;
}