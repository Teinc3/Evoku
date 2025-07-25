import { ByteCodec, StringCodec } from "../primitive";
import CustomCodec from "../CustomCodec";

import type { ICustomCodec } from "../../../types/networking/ICodec";
import type PlayerInfoContract from "../../../types/contracts/components/custom/PlayerInfoContract";


export default class PlayerInfoCodec extends CustomCodec<PlayerInfoContract>
  implements ICustomCodec<PlayerInfoContract> {

  readonly codecMap = {
    playerID: ByteCodec,
    username: StringCodec
  }
  
}