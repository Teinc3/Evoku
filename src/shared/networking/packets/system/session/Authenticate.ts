import createPacket from "../../factory/createPacket";
import StringCodec from "../../../codecs/primitive/StringCodec";
import SessionActions from "../../../../types/enums/actions/system/session";


export default createPacket(SessionActions.AUTH, {
  token: StringCodec,
  version: StringCodec,
});
