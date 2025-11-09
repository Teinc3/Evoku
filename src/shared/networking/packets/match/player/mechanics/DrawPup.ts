import createActionPacket from "../../../factory/createActionPacket";
import MechanicsActions from "../../../../../types/enums/actions/match/player/mechanics";


export const DrawPup = createActionPacket(
  MechanicsActions.DRAW_PUP,
  ['clientTime', 'actionID'],
  {}
);

export const PupDrawn = createActionPacket(
  MechanicsActions.PUP_DRAWN,
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);
