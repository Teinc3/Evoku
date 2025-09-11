import PacketBuffer from "./PacketBuffer";
import packetRegistry from "../registry";
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
    packetBuffer.index = 0; // Write bumps index, reset it for reading from start

    const action = (new ActionCodec).decode(packetBuffer);
    const Packet = packetRegistry.getPacket(action);
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
    const Packet = packetRegistry.getPacket(action);
    if (!Packet) {
      throw new Error(`No packet registered for action: ${action}`);
    }

    const buffer = new Packet({
      action,
      ...dataContract
    }).wrap().nonResizeableBuffer;
    // if (this.security) {
    //   buffer = this.security.encrypt(buffer);
    // }
    return buffer;
  }
}