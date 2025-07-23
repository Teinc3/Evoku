import PacketIO from '@shared/networking/utils/PacketIO';

import type WebSocket from 'ws';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * Wrapper for a ws WebSocket that automatically encodes/decodes packets.
 */
export default class GameSocket {
  private ws: WebSocket;
  private packetIO: PacketIO;

  constructor(ws: WebSocket) {
    this.ws = ws;
    this.packetIO = new PacketIO();
  }

  /**
   * Send a contract object as a binary packet.
   */
  send<GenericAction extends ActionEnum>(action: GenericAction, data: ActionMap[GenericAction]) {
    const buffer = this.packetIO.encodePacket(action, data);
    this.ws.send(buffer);
  }

  /**
   * Listen for decoded packets. Handler receives the decoded contract object.
   */
  onPacket<T = unknown>(handler: (data: T) => void) {
    this.ws.on('message', (message: WebSocket.RawData) => {
      try {
        // Only handle binary messages
        if (message instanceof Buffer || message instanceof ArrayBuffer) {
          const arrayBuffer = message instanceof Buffer
            ? message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength)
            : message;
          const data = this.packetIO.decodePacket(arrayBuffer as ArrayBuffer);
          handler(data as T);
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
