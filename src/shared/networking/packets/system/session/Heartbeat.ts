import SessionActions from "../../../../types/enums/actions/system/session";
import createPacket from "../../factory/createPacket";


export default createPacket(SessionActions.HEARTBEAT, {});