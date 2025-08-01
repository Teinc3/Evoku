import { ByteCodec } from "../primitive";
import scrambler from '../../security/scramble'

import type IPacketBuffer from "../../../types/networking/IPacketBuffer";
import type ActionEnum from '../../../types/enums/actions';


/**
 * A special codec that scrambles action IDs before encoding/after decoding
 * to prevent static network analysis of packet contents.
 */
export default class ActionCodec<GenericAction extends ActionEnum> extends ByteCodec {
  override encode(buffer: IPacketBuffer, data: GenericAction): number {
    return super.encode(buffer, scrambler.scrambleID(data));
  }

  override decode(buffer: IPacketBuffer): GenericAction {
    return scrambler.unscrambleID(super.decode(buffer)) as GenericAction;
  }
}