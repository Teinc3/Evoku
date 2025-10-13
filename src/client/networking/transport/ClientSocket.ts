import PacketIO from '@shared/networking/utils/PacketIO';
import sharedConfig from "@shared/config";

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * Transport-only wrapper around native WebSocket + PacketIO.
 * Handles connection, encoding/decoding, and basic event emission.
 * No reconnection, heartbeat, action routing, or queues.
 */
export default class ClientSocket {
  private ws: WebSocket | null;
  private readonly io: PacketIO;
  private readonly url: string;

  constructor() {
    this.ws = null;
    this.url = sharedConfig.networking.ws.uri;
    this.io = new PacketIO();
  }

  /**
   * Current WebSocket ready state
   */
  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  /**
   * Whether the socket is currently open
   */
  get isOpen(): boolean {
    return this.readyState === WebSocket.OPEN;
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    if (this.ws && (this.isOpen || this.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.ws = new WebSocket(this.url);
    this.ws.binaryType = 'arraybuffer';

    await new Promise<void>((resolve, reject) => {
      const onOpen = () => {
        cleanup();
        resolve();
      };

      const onError = (e: Event) => {
        cleanup();
        reject(e);
      };

      const cleanup = () => {
        this.ws?.removeEventListener('open', onOpen);
        this.ws?.removeEventListener('error', onError);
      };

      this.ws!.addEventListener('open', onOpen);
      this.ws!.addEventListener('error', onError);
    });
  }

  /**
   * Close the WebSocket connection
   */
  close(code?: number, reason?: string): void {
    this.ws?.removeEventListener('message', this.handleMessage);
    this.ws?.close(code, reason);
    this.ws = null;
  }

  /**
   * Send a packet through the WebSocket using the same pattern as ServerSocket
   */
  send<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ): void {
    if (!this.ws || !this.isOpen) {
      throw new Error('WebSocket not open');
    }

    const buffer = this.io.encodePacket(action, data);
    this.ws.send(buffer);
  }

  /**
   * Set a packet handler, similar to ServerSocket.setListener
   */
  setListener(handler: (data: AugmentAction<ActionEnum>) => void): void {
    if (!this.ws) {
      throw new Error('WebSocket not connected');
    }

    this.ws.removeEventListener('message', this.handleMessage);
    this.ws.addEventListener('message', this.handleMessage);
    this.packetHandler = handler;
  }

  /**
   * Set close and error handlers
   */
  onClose(handler: () => void): void {
    if (this.ws) {
      this.ws.addEventListener('close', handler);
    }
  }

  onError(handler: (event: Event) => void): void {
    if (this.ws) {
      this.ws.addEventListener('error', handler);
    }
  }

  // Private members
  private packetHandler: ((data: AugmentAction<ActionEnum>) => void) | null = null;

  private handleMessage = async (ev: MessageEvent): Promise<void> => {
    try {
      const buffer = ev.data instanceof ArrayBuffer
        ? ev.data
        : ev.data instanceof Blob
          ? await ev.data.arrayBuffer()
          : null;

      if (!buffer || !this.packetHandler) {
        return;
      }

      const data = this.io.decodePacket(buffer);
      this.packetHandler(data);
    } catch {
      // Swallow malformed frames like ServerSocket does
    }
  };
}
