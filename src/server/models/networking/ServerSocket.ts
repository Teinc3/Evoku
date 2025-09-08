import WebSocket from 'ws';

import PacketIO from '@shared/networking/utils/PacketIO';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * Wrapper for a server-side WebSocket that automatically encodes/decodes packets.
 */
export default class ServerSocket {
  private packetIO: PacketIO;

  constructor(
    private ws: WebSocket,
  ) {
    this.packetIO = new PacketIO();
  }

  /**
   * Send a contract object as a binary packet.
   */
  public send<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ) {
    const buffer = this.packetIO.encodePacket(action, data);
    this.ws.send(buffer);
  }

  /**
   * Async send method that ensures packets are loaded.
   */
  public async sendAsync<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ) {
    const buffer = await this.packetIO.encodePacketAsync(action, data);
    this.ws.send(buffer);
  }

  /**
   * Public function to attach a packet handler.
   * Allows forwarding of all incoming packet data to a handler function.
   */
  public setListener(handler: (data: AugmentAction<ActionEnum>) => void) {
    this.ws.removeAllListeners('message'); // Prevent duplicate handlers
    this.ws.on('message', (message: WebSocket.RawData, isBinary: boolean) => {
      try {
        if (isBinary) {
          const arrayBuffer = message instanceof Buffer
            ? message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength)
            : message;
          const data = this.packetIO.decodePacket(arrayBuffer as ArrayBuffer);
          handler(data);
        } else {
          this.close();
        }
      } catch {
        // Optionally emit an error event or log
        // console.error('Failed to decode packet:', err);
      }
    });
  }

  /**
   * Async version of setListener that ensures packets are loaded.
   */
  public setListenerAsync(handler: (data: AugmentAction<ActionEnum>) => void) {
    this.ws.removeAllListeners('message'); // Prevent duplicate handlers
    this.ws.on('message', async (message: WebSocket.RawData, isBinary: boolean) => {
      try {
        if (isBinary) {
          const arrayBuffer = message instanceof Buffer
            ? message.buffer.slice(message.byteOffset, message.byteOffset + message.byteLength)
            : message;
          const data = await this.packetIO.decodePacketAsync(arrayBuffer as ArrayBuffer);
          handler(data);
        } else {
          this.close();
        }
      } catch {
        // Optionally emit an error event or log
        // console.error('Failed to decode packet:', err);
      }
    });
  }

  /**
   * Proxy for closing the socket.
   * This will remove all listeners and close the WebSocket connection.
   */
  close() {
    this.ws.removeAllListeners();

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
  }

  /**
   * Proxy for checking ready state.
   */
  get readyState() {
    return this.ws.readyState;
  }
}
