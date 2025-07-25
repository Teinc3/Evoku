import type LifecycleActions from "../enums/actions/match/lifecycle";
import type { JoinQueueContract, LeaveQueueContract,
  QueueUpdateContract } from "../contracts/lifecycle/QueueContract";
import type MatchFoundContract from "../contracts/lifecycle/MatchFoundContract";
import type GameOverContract from "../contracts/lifecycle/GameOverContract";
import type GameInitContract from "../contracts/lifecycle/GameInitContract";


export default interface LifecycleActionMap {
  [LifecycleActions.JOIN_QUEUE]: JoinQueueContract;
  [LifecycleActions.LEAVE_QUEUE]: LeaveQueueContract;
  [LifecycleActions.QUEUE_UPDATE]: QueueUpdateContract;
  [LifecycleActions.MATCH_FOUND]: MatchFoundContract;
  [LifecycleActions.GAME_INIT]: GameInitContract;
  [LifecycleActions.GAME_OVER]: GameOverContract;
}