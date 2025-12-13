import redisService from '../redis';
import * as jwt from '../../utils/jwt';
import { GuestAuthService } from '.';


jest.mock('../redis');
jest.mock('../../utils/jwt');

describe('GuestAuthService', () => {
  let service: GuestAuthService;
  const mockRedisGet = jest.mocked(redisService.get);
  const mockRedisSet = jest.mocked(redisService.set);
  const mockRedisTtl = jest.mocked(redisService.ttl);
  const mockGeneratePlayerId = jest.mocked(jwt.generatePlayerId);
  const mockSignGuestToken = jest.mocked(jwt.signGuestToken);
  const mockVerifyGuestToken = jest.mocked(jwt.verifyGuestToken);

  beforeEach(() => {
    service = new GuestAuthService();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    describe('without existing token', () => {
      it('should create a new guest player with token', async () => {
        const mockPlayerId = '550e8400-e29b-41d4-a716-446655440000';
        const mockToken = 'new-jwt-token';
        
        mockGeneratePlayerId.mockReturnValue(mockPlayerId);
        mockSignGuestToken.mockReturnValue(mockToken);

        const result = await service.authenticate();

        expect(mockGeneratePlayerId).toHaveBeenCalledTimes(1);
        expect(mockSignGuestToken).toHaveBeenCalledWith(mockPlayerId);
        expect(mockRedisSet).toHaveBeenCalledWith(
          `guest:player:${mockPlayerId}`,
          JSON.stringify({ elo: 0 }),
          { EX: 604800 }
        );
        expect(result).toEqual({
          token: mockToken,
          elo: 0,
          userID: '550e8400-e29b-41d4-a716-446655440000'
        });
      });
    });

    describe('with valid existing token', () => {
      it('should return existing player data with refreshed token', async () => {
        const existingPlayerId = '550e8400-e29b-41d4-a716-446655440001';
        const oldToken = 'old-jwt-token';
        const newToken = 'new-jwt-token';
        const existingElo = 1500;

        mockVerifyGuestToken.mockReturnValue(existingPlayerId);
        mockRedisGet.mockResolvedValue(JSON.stringify({ elo: existingElo }));
        mockSignGuestToken.mockReturnValue(newToken);

        const result = await service.authenticate(oldToken);

        expect(mockVerifyGuestToken).toHaveBeenCalledWith(oldToken);
        expect(mockRedisGet).toHaveBeenCalledWith(`guest:player:${existingPlayerId}`);
        expect(mockSignGuestToken).toHaveBeenCalledWith(existingPlayerId);
        expect(mockRedisSet).toHaveBeenCalledWith(
          `guest:player:${existingPlayerId}`,
          JSON.stringify({ elo: existingElo }),
          { EX: 604800 }
        );
        expect(result).toEqual({
          token: newToken,
          elo: existingElo,
          userID: '550e8400-e29b-41d4-a716-446655440001'
        });
      });
    });

    describe('with invalid token', () => {
      it('should create a new guest player', async () => {
        const invalidToken = 'invalid-token';
        const mockPlayerId = '550e8400-e29b-41d4-a716-446655440002';
        const mockToken = 'new-jwt-token';

        mockVerifyGuestToken.mockReturnValue(null);
        mockGeneratePlayerId.mockReturnValue(mockPlayerId);
        mockSignGuestToken.mockReturnValue(mockToken);

        const result = await service.authenticate(invalidToken);

        expect(mockVerifyGuestToken).toHaveBeenCalledWith(invalidToken);
        expect(mockGeneratePlayerId).toHaveBeenCalledTimes(1);
        expect(mockSignGuestToken).toHaveBeenCalledWith(mockPlayerId);
        expect(result).toEqual({
          token: mockToken,
          elo: 0,
          userID: '550e8400-e29b-41d4-a716-446655440002'
        });
      });
    });

    describe('with valid token but no Redis record', () => {
      it('should create a new guest player', async () => {
        const existingPlayerId = '550e8400-e29b-41d4-a716-446655440003';
        const oldToken = 'old-jwt-token';
        const mockPlayerId = '550e8400-e29b-41d4-a716-446655440004';
        const mockToken = 'new-jwt-token';

        mockVerifyGuestToken.mockReturnValue(existingPlayerId);
        mockRedisGet.mockResolvedValue(null);
        mockGeneratePlayerId.mockReturnValue(mockPlayerId);
        mockSignGuestToken.mockReturnValue(mockToken);

        const result = await service.authenticate(oldToken);

        expect(mockVerifyGuestToken).toHaveBeenCalledWith(oldToken);
        expect(mockRedisGet).toHaveBeenCalledWith(`guest:player:${existingPlayerId}`);
        expect(mockGeneratePlayerId).toHaveBeenCalledTimes(1);
        expect(mockSignGuestToken).toHaveBeenCalledWith(mockPlayerId);
        expect(result).toEqual({
          token: mockToken,
          elo: 0,
          userID: '550e8400-e29b-41d4-a716-446655440004'
        });
      });
    });
  });

  describe('updateElo', () => {
    it('should update ELO and preserve existing TTL', async () => {
      const playerId = '550e8400-e29b-41d4-a716-446655440000';
      const newElo = 1040;

      mockRedisTtl.mockResolvedValue(3600); // 1 hour TTL

      await service.updateElo(playerId, newElo);

      expect(mockRedisTtl).toHaveBeenCalledWith(`guest:player:${playerId}`);
      expect(mockRedisSet).toHaveBeenCalledWith(
        `guest:player:${playerId}`,
        JSON.stringify({ elo: newElo }),
        { EX: 3600 }
      );
    });

    it('should update ELO with default expiration if key has no TTL', async () => {
      const playerId = '550e8400-e29b-41d4-a716-446655440001';
      const newElo = 960;

      mockRedisTtl.mockResolvedValue(-1); // No expiration

      await service.updateElo(playerId, newElo);

      expect(mockRedisTtl).toHaveBeenCalledWith(`guest:player:${playerId}`);
      expect(mockRedisSet).toHaveBeenCalledWith(
        `guest:player:${playerId}`,
        JSON.stringify({ elo: newElo }),
        { EX: 604800 }
      );
    });

    it('should update ELO with default expiration if key does not exist', async () => {
      const playerId = '550e8400-e29b-41d4-a716-446655440002';
      const newElo = 1000;

      mockRedisTtl.mockResolvedValue(-2); // Key does not exist

      await service.updateElo(playerId, newElo);

      expect(mockRedisTtl).toHaveBeenCalledWith(`guest:player:${playerId}`);
      expect(mockRedisSet).toHaveBeenCalledWith(
        `guest:player:${playerId}`,
        JSON.stringify({ elo: newElo }),
        { EX: 604800 }
      );
    });
  });
});
