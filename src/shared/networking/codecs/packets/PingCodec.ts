import PingContract from "@shared/types/contracts/networking/PingContract";
import CustomCodec from "../CustomCodec";
import IntCodec from "../primitive/IntCodec";


export default class PingCodec extends CustomCodec<PingContract> {
    codecMap = {
        timestamp: IntCodec
    };
}