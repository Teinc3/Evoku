import PacketBuffer from "./PacketBuffer";
import PacketRegistry from "../registry";
import ActionCodec from "../codecs/custom/ActionCodec";

import type ActionEnum from "../../types/enums/actions";
import type ActionMap from "../../types/actionmap";


// import type { SecurityModule } from "../security/SecurityModule";


export default class PacketIO {
  // private security?: SecurityModule;
  private static initPromise: Promise<void> | null = null;

  // constructor(security?: SecurityModule) {
  //   this.security = security;
  // }

  /**
   * Ensure packet registry is initialized before any packet operations
   */
  private static async ensureInitialized(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = PacketRegistry.initialize();
    }
    await this.initPromise;
  }

  /**
   * Try to initialize the registry synchronously if needed.
   * This is a fallback for cases where async initialization isn't possible.
   */
  private static trySync(): void {
    if (!PacketRegistry.isInitialized() && PacketRegistry.getRegisteredCount() === 0) {
      // Trigger sync initialization if no async init is in progress
      if (!this.initPromise) {
        this.initPromise = PacketRegistry.initialize();
      }
    }
  }

  decodePacket(buffer: ArrayBuffer) {
    PacketIO.trySync();
    
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
    PacketIO.trySync();
    
    const Packet = PacketRegistry.getPacket(action);
    if (!Packet) {
      throw new Error(`No packet registered for action: ${action}`);
    }

    const buffer = new Packet({
      action,
      ...dataContract
    }).wrap().buffer;
    // if (this.security) {
    //   buffer = this.security.encrypt(buffer);
    // }
    return buffer;
  }

  /**
   * Async version of decodePacket for when you can await initialization
   */
  async decodePacketAsync(buffer: ArrayBuffer) {
    await PacketIO.ensureInitialized();
    return this.decodePacket(buffer);
  }

  /**
   * Async version of encodePacket for when you can await initialization
   */
  async encodePacketAsync<
    GenericAction extends ActionEnum,
    GenericContract extends ActionMap[GenericAction]
  >(action: GenericAction, dataContract: GenericContract) {
    await PacketIO.ensureInitialized();
    return this.encodePacket(action, dataContract);
  }
}