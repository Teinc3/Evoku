import type ProtocolActions from "./protocol";
import type PlayerActions from "./player";
import type LifecycleActions from "./lifecycle";


type MatchActions = LifecycleActions | PlayerActions | ProtocolActions;

export default MatchActions;