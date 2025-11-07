import type LifecycleActions from "../../enums/actions/system/lobby";
import type {
  JoinQueueContract, QueueUpdateContract, LeaveQueueContract, MatchFoundContract
} from "../../contracts/system/lobby";


export default interface LobbyActionMap {
  [LifecycleActions.JOIN_QUEUE]: JoinQueueContract;
  [LifecycleActions.LEAVE_QUEUE]: LeaveQueueContract;
  [LifecycleActions.QUEUE_UPDATE]: QueueUpdateContract;
  [LifecycleActions.MATCH_FOUND]: MatchFoundContract;
}