import PacketBuffer from "./PacketBuffer";
import PacketRegistry from "../registry";
import ActionCodec from "../codecs/custom/ActionCodec";

import type ActionEnum from "../../types/enums/actions";
import type ActionMap from "../../types/actionmap";
// import type { SecurityModule } from "../security/SecurityModule";

export default class PacketIO {
  // private security?: SecurityModule;

  // constructor(security?: SecurityModule) {
  //   this.security = security;
  // }

  decodePacket(buffer: ArrayBuffer) {
    // let dataBuffer = buffer;
    // if (this.security) {
    //   dataBuffer = this.security.decrypt(buffer);
    // }
    const packetBuffer = new PacketBuffer(buffer.byteLength);
    packetBuffer.write(buffer);

    const action = (new ActionCodec).decode(packetBuffer);
    const Packet = PacketRegistry.getPacket(action);
    if (!Packet) {
      throw new Error(`No packet registered for action: ${action}`);
    }

    // Reset index to allow packet codec to read the complete thing
    packetBuffer.index = 0;
    const data = (new Packet).unwrap(packetBuffer);
    return data;
  }

  encodePacket<
    GenericAction extends ActionEnum,
    GenericContract extends ActionMap[GenericAction]
  >(action: GenericAction, dataContract: GenericContract) {
    const Packet = PacketRegistry.getPacket(action);
    if (!Packet) {
      throw new Error(`No packet registered for action: ${action}`);
    }

    let buffer = new Packet({
      action,
      ...dataContract
    }).wrap().buffer;
    // if (this.security) {
    //   buffer = this.security.encrypt(buffer);
    // }
    return buffer;
  }
}