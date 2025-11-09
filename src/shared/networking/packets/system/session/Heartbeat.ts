import createPacket from "../../factory/createPacket";
import SessionActions from "../../../../types/enums/actions/system/session";


export default createPacket(SessionActions.HEARTBEAT, {});
