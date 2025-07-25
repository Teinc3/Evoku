import type LifecycleActions from "../../enums/actions/match/lifecycle";
import type GameOverContract from "../../contracts/match/lifecycle/GameOverContract";
import type GameInitContract from "../../contracts/match/lifecycle/GameInitContract";


export default interface LifecycleActionMap {
  [LifecycleActions.GAME_INIT]: GameInitContract;
  [LifecycleActions.GAME_OVER]: GameOverContract;
}