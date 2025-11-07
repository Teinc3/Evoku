import type LifecycleActions from "../../enums/actions/match/lifecycle";
import type { GameOverContract, GameInitContract } from "../../contracts/match/lifecycle";


export default interface LifecycleActionMap {
  [LifecycleActions.GAME_INIT]: GameInitContract;
  [LifecycleActions.GAME_OVER]: GameOverContract;
}