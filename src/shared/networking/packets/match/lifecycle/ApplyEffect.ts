import createActionPacket from "../../factory/createActionPacket";
import LifecycleActions from "../../../../types/enums/actions/match/lifecycle";


export default createActionPacket(
  LifecycleActions.APPLY_EFFECT,
  ['serverTime', 'playerID', 'pupID', 'targetID'],
  {}
);
