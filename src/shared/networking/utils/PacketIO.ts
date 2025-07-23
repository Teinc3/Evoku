import PacketBuffer from "./PacketBuffer";
import PacketRegistry from "../registry";
import ActionCodec from "../codecs/custom/ActionCodec";

import type ActionEnum from "../../types/enums/actions";
import type ActionMap from "../../types/actionmap";


export function decodePacket(buffer: ArrayBuffer) {
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
  return { action, data };
}

export function encodePacket<
  GenericAction extends ActionEnum,
  GenericContract extends ActionMap[GenericAction]
>(action: GenericAction, dataContract: GenericContract) {

  const Packet = PacketRegistry.getPacket(action);
  if (!Packet) {
    throw new Error(`No packet registered for action: ${action}`);
  }

  return new Packet({
    action,
    ...dataContract
  }).wrap().buffer;

}