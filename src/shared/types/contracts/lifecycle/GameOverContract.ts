import type GameOverReason from "../../../types/enums/GameOverReason";
import type IDataContract from "../IDataContract";


export default interface GameOverContract extends IDataContract {
    winnerID: number;
    reason: GameOverReason;
}