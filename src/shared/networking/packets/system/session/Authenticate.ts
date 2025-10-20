import createPacket from "../../factory/createPacket";
import SessionActions from "../../../../types/enums/actions/system/session";
import StringCodec from "../../../codecs/primitive/StringCodec";


export default createPacket(SessionActions.AUTH, {
  token: StringCodec,
  version: StringCodec,
});
