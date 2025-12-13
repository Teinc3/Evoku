import type IDataContract from "../../components/base/IDataContract";
import type GameOverReason from "../../../enums/GameOverReason";


export default interface GameOverContract extends IDataContract {
  winnerID: number;
  reason: GameOverReason;
  // Elo change for winner
  // elo info already stored in initial matchfound state
  eloChange: number;
}
