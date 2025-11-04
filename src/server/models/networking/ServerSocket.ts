import WebSocket from 'ws';

import WSCloseCode from '@shared/types/enums/ws-codes.enum';
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
    private onClose: (code: number) => void,
    private onError: (err: Error) => void
  ) {
    this.packetIO = new PacketIO();
    this.ws.on('close', code => this.onClose(code));
    this.ws.on('error', err => this.onError(err));
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
          this.close(WSCloseCode.UNSUPPORTED_DATA, 'Only binary messages are supported');
        }
      } catch {
        // console.error('Failed to decode packet:', err);
      }
    });
  }

  /**
   * Proxy for closing the socket.
   * This will remove all listeners and close the WebSocket connection.
   * @param code WebSocket close code (defaults to NORMAL_CLOSURE)
   * @param reason Optional reason string
   */
  close(code: number = WSCloseCode.NORMAL_CLOSURE, reason?: string) {
    this.ws.removeAllListeners();

    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(code, reason);
    }
  }

  /**
   * Proxy for checking ready state.
   */
  get readyState() {
    return this.ws.readyState;
  }
}
