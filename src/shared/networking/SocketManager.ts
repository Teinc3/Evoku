import PacketBuffer from "../utils/PacketBuffer";
import PacketRegistry from "./registry/PacketRegistry";
import ActionCodec from "./codecs/custom/ActionCodec";

import type AugmentAction from "../types/utils/AugmentAction";
import type ActionEnum from "../types/enums/actions";
import type ActionMap from "../types/actionmap";


/**
 * Isomorphic wrapper class for a WebSocket connection.
 * Manages connection state and data transmission for both client and server.
 */
export default class SocketManager {

  private socket: WebSocket | null;
  private url: string | null;
  private isConnected: boolean;
  // private readonly securityModule: SecurityModule

  constructor(
    private dispatch: <GenericAction extends ActionEnum>(
      data: AugmentAction<GenericAction>
    ) => void,
    socketOrURL: WebSocket | string
  ) {
    // Register this manager to the data dispatcher
    this.dispatch = this.dispatch.bind(this);

    if (typeof socketOrURL === "string") {
      this.url = socketOrURL;
      this.socket = null;
      this.isConnected = false;
    } else {
      this.socket = socketOrURL;
      this.url = null;
      this.isConnected = this.socket.readyState === WebSocket.OPEN;
    }
  }

  /**
   * Client-side method to initiate a WebSocket connection to the server.
   */
  connect(): void {
    if (this.isConnected) return;

    this.socket = new WebSocket(this.url!);
    this.socket.onopen = () => {

      if (this.socket?.binaryType !== "arraybuffer") {
        this.socket?.close(1003);
        console.error("WebSocket must use binary type 'arraybuffer'. Connection closed.");
        return;
      }

      this.isConnected = true;
      console.log("WebSocket connection established.");
    };

    this.socket.onclose = () => {
      this.isConnected = false;
      console.log("WebSocket connection closed.");
    };

    this.socket.onerror = error => {
      this.isConnected = false;
      console.error("WebSocket error:", error);
    };

    this.socket.onmessage = this.on.bind(this);
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.isConnected = false;
      this.socket = null;
    }
  }

  private on(event: MessageEvent): void {
    // Reject non-binary messages
    if (!(event.data instanceof ArrayBuffer)) {
      console.warn("Received non-binary message.");
      return;
    }

    // Fit the data into a PacketBuffer
    const packetBuffer = new PacketBuffer(event.data.byteLength);
    packetBuffer.write(event.data);

    // Read the action from the packet buffer
    const action = (new ActionCodec).decode(packetBuffer);
    const Packet = PacketRegistry.getPacket(action);
    if (!Packet) {
      console.error(`No packet registered for action: ${action}`);
      return;
    }

    // Create an instance of the packet and unwrap the data
    packetBuffer.index = 0; // Reset index to allow decoding from start
    const data = (new Packet).unwrap(packetBuffer);
    
    // Dispatch to appropriate handler
    this.dispatch(data);
  }

  public send<
    GenericAction extends ActionEnum,
    GenericContract extends ActionMap[GenericAction]
  >(
    action: GenericAction,
    dataContract: GenericContract
  ): void {

    const Packet = PacketRegistry.getPacket(action)
    if (!Packet) {
      console.error(`No packet registered for action: ${action}`);
      return;
    }

    const packetBuffer = new Packet({
      action: action,
      ...dataContract
    }).wrap();

    if (this.isConnected && this.socket) {
      this.socket.send(packetBuffer.buffer);
    } else {
      console.warn("Cannot send data, WebSocket is not connected.");
    }
    
  }

}