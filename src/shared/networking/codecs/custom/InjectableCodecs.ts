import { IntCodec, ByteCodec, ShortCodec } from "../primitive";

import type { InjectableCodecMap } from "../../../types/utils/CodecExtensionHelpers";


const INJECTABLE_CODECS: InjectableCodecMap = {
  serverTime: IntCodec,
  clientTime: IntCodec,
  actionID: ByteCodec,
  pupID: ShortCodec,
  playerID: ByteCodec,
  targetID: ByteCodec,
  cellIndex: ShortCodec,
  value: ByteCodec
} as const;

export default INJECTABLE_CODECS;