import type LifecycleActions from "../../enums/actions/system/lobby";
import type {
  JoinQueueContract, QueueUpdateContract, LeaveQueueContract
} from "../../contracts/system/lobby/QueueContract";
import type MatchFoundContract from "../../contracts/system/lobby/MatchFoundContract";


export default interface LobbyActionMap {
  [LifecycleActions.JOIN_QUEUE]: JoinQueueContract;
  [LifecycleActions.LEAVE_QUEUE]: LeaveQueueContract;
  [LifecycleActions.QUEUE_UPDATE]: QueueUpdateContract;
  [LifecycleActions.MATCH_FOUND]: MatchFoundContract;
}