import * as jwt from '../utils/jwt';
import redisService from './RedisService';
import { GuestAuthService } from './GuestAuthService';


jest.mock('./RedisService');
jest.mock('../utils/jwt');

describe('GuestAuthService', () => {
  let service: GuestAuthService;
  const mockRedisGet = jest.mocked(redisService.get);
  const mockRedisSet = jest.mocked(redisService.set);
  const mockGeneratePlayerId = jest.mocked(jwt.generatePlayerId);
  const mockSignGuestToken = jest.mocked(jwt.signGuestToken);
  const mockVerifyGuestToken = jest.mocked(jwt.verifyGuestToken);

  beforeEach(() => {
    service = new GuestAuthService();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    describe('without existing token', () => {
      it('should create a new guest player', async () => {
        const mockPlayerId = 'new-player-id';
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
          elo: 0
        });
      });
    });

    describe('with valid existing token', () => {
      it('should return existing player data with new token', async () => {
        const existingPlayerId = 'existing-player-id';
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
        expect(result).toEqual({
          token: newToken,
          elo: existingElo
        });
      });
    });

    describe('with invalid token', () => {
      it('should create a new guest player', async () => {
        const invalidToken = 'invalid-token';
        const mockPlayerId = 'new-player-id';
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
          elo: 0
        });
      });
    });

    describe('with valid token but no Redis record', () => {
      it('should create a new guest player', async () => {
        const existingPlayerId = 'existing-player-id';
        const oldToken = 'old-jwt-token';
        const mockPlayerId = 'new-player-id';
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
          elo: 0
        });
      });
    });
  });
});
