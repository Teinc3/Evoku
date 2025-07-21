import type Lifecycle from "../enums/actions/lifecycle";
import type { JoinQueueContract, LeaveQueueContract,
    QueueUpdateContract } from "../contracts/lifecycle/QueueContract";
import type MatchFoundContract from "../contracts/lifecycle/MatchFoundContract";
import type GameInitContract from "../contracts/lifecycle/GameInitContract";
import type GameOverContract from "../contracts/lifecycle/GameOverContract";


export default interface LifecycleActionMap {
    [Lifecycle.JOIN_QUEUE]: JoinQueueContract;
    [Lifecycle.LEAVE_QUEUE]: LeaveQueueContract;
    [Lifecycle.QUEUE_UPDATE]: QueueUpdateContract;
    [Lifecycle.MATCH_FOUND]: MatchFoundContract;
    [Lifecycle.GAME_INIT]: GameInitContract;
    [Lifecycle.GAME_OVER]: GameOverContract;
}