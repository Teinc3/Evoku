import PacketIO from '@shared/networking/utils/PacketIO';

import type WebSocket from 'ws';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * Wrapper for a server-side WebSocket that automatically encodes/decodes packets.
 */
export default class ServerSocket {
  private packetIO: PacketIO;

  constructor(
    private ws: WebSocket,
    private onPacketHandler: (data: ActionMap[ActionEnum]) => void
  ) {
    this.packetIO = new PacketIO();
    this.onPacketHandler.bind(this);

    console.log('New WebSocket connection established');
  }

  /**
   * Send a contract object as a binary packet.
   */
  public send<GenericAction extends ActionEnum>(action: GenericAction, data: ActionMap[GenericAction]) {
    const buffer = this.packetIO.encodePacket(action, data);
    this.ws.send(buffer);
  }

  /**
   * Listen for decoded packets. Handler receives the decoded contract object.
   */
  onPacket<T = unknown>(handler: (data: T) => void) {
    this.ws.on('message', (message: WebSocket.RawData, isBinary: boolean) => {
      try {
        // Only handle binary messages
        if (isBinary) {
          const arrayBuffer = message instanceof Buffer
            ? message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength)
            : message;
          const data = this.packetIO.decodePacket(arrayBuffer as ArrayBuffer);
          handler(data as T);
        } else {
          // Close socket if non-binary message received
          this.ws.close();
        }
      } catch (err) {
        // Optionally emit an error event or log
        // console.error('Failed to decode packet:', err);
      }
    });
  }

  /**
   * Proxy for closing the socket.
   */
  close() {
    this.ws.close();
  }

  /**
   * Proxy for adding event listeners.
   */
  on(event: string, listener: (...args: any[]) => void) {
    this.ws.on(event, listener);
  }

  /**
   * Proxy for checking ready state.
   */
  get readyState() {
    return this.ws.readyState;
  }
}
