import { firstValueFrom, take, toArray } from 'rxjs';

import PacketBroadcaster from './PacketBroadcaster';
import SessionActions from '@shared/types/enums/actions/system/session';
import LobbyActions from '@shared/types/enums/actions/system/lobby';

import type ActionEnum from '@shared/types/enums/actions';


describe('PacketBroadcaster', () => {
  let broadcaster: PacketBroadcaster;

  beforeEach(() => {
    broadcaster = new PacketBroadcaster();
  });

  afterEach(() => {
    broadcaster.destroy();
  });

  describe('broadcast', () => {
    it('should broadcast packets to all subscribers', async () => {
      const packets: Array<{ action: ActionEnum; data: unknown }> = [];
      
      broadcaster.getPacketStream().pipe(take(2)).subscribe((packet) => {
        packets.push(packet);
      });

      broadcaster.broadcast(SessionActions.HEARTBEAT, {});
      broadcaster.broadcast(SessionActions.AUTH, { token: 'test', version: '1.0.0' });

      // Wait a bit for async processing
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(packets.length).toBe(2);
      expect(packets[0].action).toBe(SessionActions.HEARTBEAT);
      expect(packets[1].action).toBe(SessionActions.AUTH);
      expect(packets[1].data).toEqual({ token: 'test', version: '1.0.0' });
    });

    it('should handle multiple subscribers', async () => {
      const subscriber1Packets: unknown[] = [];
      const subscriber2Packets: unknown[] = [];

      broadcaster.getPacketStream().pipe(take(1)).subscribe((packet) => {
        subscriber1Packets.push(packet);
      });

      broadcaster.getPacketStream().pipe(take(1)).subscribe((packet) => {
        subscriber2Packets.push(packet);
      });

      broadcaster.broadcast(SessionActions.HEARTBEAT, {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(subscriber1Packets.length).toBe(1);
      expect(subscriber2Packets.length).toBe(1);
    });
  });

  describe('onPacket', () => {
    it('should filter packets by action type', async () => {
      const heartbeatPackets: unknown[] = [];
      const authPackets: unknown[] = [];

      broadcaster.onPacket(SessionActions.HEARTBEAT).pipe(take(1)).subscribe((data) => {
        heartbeatPackets.push(data);
      });

      broadcaster.onPacket(SessionActions.AUTH).pipe(take(1)).subscribe((data) => {
        authPackets.push(data);
      });

      broadcaster.broadcast(SessionActions.HEARTBEAT, {});
      broadcaster.broadcast(SessionActions.AUTH, { token: 'test', version: '1.0.0' });
      broadcaster.broadcast(SessionActions.HEARTBEAT, {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(heartbeatPackets.length).toBe(1);
      expect(authPackets.length).toBe(1);
      expect(authPackets[0]).toEqual({ token: 'test', version: '1.0.0' });
    });

    it('should not emit packets of different action types', async () => {
      const receivedData: unknown[] = [];

      broadcaster.onPacket(SessionActions.HEARTBEAT).pipe(take(1)).subscribe((data) => {
        receivedData.push(data);
      });

      broadcaster.broadcast(SessionActions.AUTH, { token: 'test', version: '1.0.0' });
      broadcaster.broadcast(SessionActions.HEARTBEAT, {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(receivedData.length).toBe(1);
      expect(receivedData[0]).toEqual({});
    });

    it('should handle multiple action types correctly', async () => {
      const promise = firstValueFrom(
        broadcaster.getPacketStream().pipe(take(4), toArray())
      );

      broadcaster.broadcast(SessionActions.HEARTBEAT, {});
      broadcaster.broadcast(LobbyActions.QUEUE_UPDATE, { inQueue: true });
      broadcaster.broadcast(SessionActions.AUTH, { token: 'test', version: '1.0.0' });
      broadcaster.broadcast(LobbyActions.MATCH_FOUND, { myID: 1, players: [] });

      const packets = await promise;

      expect(packets.length).toBe(4);
      expect(packets[0].action).toBe(SessionActions.HEARTBEAT);
      expect(packets[1].action).toBe(LobbyActions.QUEUE_UPDATE);
      expect(packets[2].action).toBe(SessionActions.AUTH);
      expect(packets[3].action).toBe(LobbyActions.MATCH_FOUND);
    });
  });

  describe('destroy', () => {
    it('should complete the packet stream', async () => {
      let completed = false;
      
      broadcaster.getPacketStream().subscribe({
        complete: () => {
          completed = true;
        }
      });

      broadcaster.destroy();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(completed).toBe(true);
    });

    it('should not emit packets after destruction', async () => {
      const packets: unknown[] = [];
      
      broadcaster.getPacketStream().subscribe((packet) => {
        packets.push(packet);
      });

      broadcaster.broadcast(SessionActions.HEARTBEAT, {});
      broadcaster.destroy();
      broadcaster.broadcast(SessionActions.HEARTBEAT, {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(packets.length).toBe(1);
    });
  });
});
