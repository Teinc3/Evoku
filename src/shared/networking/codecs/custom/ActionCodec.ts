import { ByteCodec } from "../primitive";
import scrambler from '../../crypto/scramble/PacketScrambler'

import type IPacketBuffer from "../../../types/utils/IPacketBuffer";
import type ActionEnum from '../../../types/enums/actions';


/**
 * A special codec that scrambles action IDs before encoding/after decoding
 * to prevent static network analysis of packet contents.
 */
export default class ActionCodec extends ByteCodec {
  override encode(buffer: IPacketBuffer, data: ActionEnum): number {
    return super.encode(buffer, scrambler.scrambleID(data));
  }
    
  override decode(buffer: IPacketBuffer): ActionEnum {
    return scrambler.unscrambleID(super.decode(buffer));
  }
}