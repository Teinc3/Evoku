import { Subject, Observable } from 'rxjs';

import type ActionEnum from '@shared/types/enums/actions';
import type ActionMap from '@shared/types/actionmap';


/**
 * Service that broadcasts decoded packets to subscribers.
 * Uses RxJS Subject to emit packets synchronously after decoding.
 */
export default class PacketBroadcaster {
  private readonly packetSubject = new Subject<{ 
    action: ActionEnum; 
    data: ActionMap[ActionEnum];
  }>();

  /**
   * Emit a decoded packet to all subscribers.
   * @param action The packet action/ID
   * @param data The decoded packet data (contract only, no action field)
   */
  broadcast<GenericAction extends ActionEnum>(
    action: GenericAction,
    data: ActionMap[GenericAction]
  ): void {
    this.packetSubject.next({ action, data });
  }

  /**
   * Subscribe to all packet broadcasts.
   * @returns Observable that emits packet events
   */
  getPacketStream(): Observable<{ action: ActionEnum; data: ActionMap[ActionEnum] }> {
    return this.packetSubject.asObservable();
  }

  /**
   * Subscribe to packets of a specific action type.
   * @param action The action to filter by
   * @returns Observable that emits only packets matching the action
   */
  onPacket<GenericAction extends ActionEnum>(
    action: GenericAction
  ): Observable<ActionMap[GenericAction]> {
    return new Observable((observer) => {
      const subscription = this.packetSubject.subscribe((packet) => {
        if (packet.action === action) {
          observer.next(packet.data as ActionMap[GenericAction]);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  /**
   * Clean up resources.
   */
  destroy(): void {
    this.packetSubject.complete();
  }
}
