import createActionPacket from "../../../factory/createActionPacket";
import { ByteCodec } from "../../../../codecs/primitive";
import MechanicsActions from "../../../../../types/enums/actions/match/player/mechanics";


export const DrawPup = createActionPacket(
  MechanicsActions.DRAW_PUP,
  [],
  {}
);

export const PupDrawn = createActionPacket(
  MechanicsActions.PUP_DRAWN,
  ['playerID', 'pupID'],
  {
    type: ByteCodec,
    level: ByteCodec,
    slotIndex: ByteCodec
  }
);

export const PupSpinAccepted = createActionPacket(
  MechanicsActions.PUP_SPUN,
  [],
  {
    element: ByteCodec,
    slotIndex: ByteCodec
  }
);
