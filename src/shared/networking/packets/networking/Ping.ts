import AbstractPacket from '@shared/networking/packets/AbstractPacket';
import PingCodec from '@shared/networking/codecs/packets/PingCodec';
import { Networking } from '@shared/types/contracts/ActionType';

import type PingContract from '@shared/types/contracts/networking/PingContract';


export default class Ping extends AbstractPacket<PingContract> {
    id = Networking.PING as const;
    Codec = PingCodec;
}