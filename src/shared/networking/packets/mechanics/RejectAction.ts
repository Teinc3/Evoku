import createActionPacket from "../../factory/createActionPacket";
import Gameplay from "../../../types/enums/mechanics/gameplay";
import { IntCodec } from "@shared/networking/codecs/primitive";


export default createActionPacket(
    Gameplay.REJECT_ACTION,
    ['actionID'],
    {
        boardHash: IntCodec
    }
);