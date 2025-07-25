import type LifecycleActions from "./lifecycle";
import type PlayerActions from "./player";
import type ProtocolActions from "./protocol";


type MatchActions = LifecycleActions | PlayerActions | ProtocolActions;

export default MatchActions;