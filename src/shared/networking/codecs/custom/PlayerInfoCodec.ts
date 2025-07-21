import PlayerInfoContract from "../../../types/contracts/lifecycle/PlayerInfoContract";
import CustomCodec from "../CustomCodec";
import { ByteCodec, StringCodec } from "../primitive";
import { ICustomCodec } from "../../../types/networking/ICodec";


export default class PlayerInfoCodec extends CustomCodec<PlayerInfoContract> implements ICustomCodec<PlayerInfoContract> {
    readonly codecMap = {
        playerID: ByteCodec,
        username: StringCodec
    }
}