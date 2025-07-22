import type IDataContract from "../IDataContract";
import type GameOverReason from "../../../types/enums/GameOverReason";


export default interface GameOverContract extends IDataContract {
  winnerID: number;
  reason: GameOverReason;
}