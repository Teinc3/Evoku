import createActionPacket from "../../factory/createActionPacket";
import Gameplay from "../../../types/enums/actions/mechanics/gameplay";
import { IntCodec } from "../../codecs/primitive";


export default createActionPacket(
    Gameplay.REJECT_ACTION,
    ['actionID'],
    {
        boardHash: IntCodec
    }
);