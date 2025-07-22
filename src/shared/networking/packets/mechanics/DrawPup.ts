import createActionPacket from "../factory/createActionPacket";
import Gameplay from "../../../types/enums/actions/mechanics/gameplay";


export const DrawPup = createActionPacket(
  Gameplay.DRAW_PUP,
  ['clientTime', 'actionID'],
  {}
);

export const PupDrawn = createActionPacket(
  Gameplay.PUP_DRAWN,
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);