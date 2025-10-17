import { generatePlayerId, signGuestToken, verifyGuestToken } from '../utils/jwt';
import redisService from './RedisService';


/**
 * Service to manage guest player authentication and data storage in Redis.
 */
export class GuestAuthService {
  private readonly defaultElo = 0;
  private readonly redisKeyPrefix = 'guest:player:';

  /**
   * Get player data from Redis
   */
  private async getPlayerData(playerId: string): Promise<{ elo: number } | null> {
    const key = `${this.redisKeyPrefix}${playerId}`;
    const data = await redisService.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as { elo: number };
  }

  /**
   * Store player data in Redis
   */
  private async setPlayerData(playerId: string, elo: number): Promise<void> {
    const key = `${this.redisKeyPrefix}${playerId}`;
    const data = JSON.stringify({ elo });
    // Set with 7 days expiration (7 * 24 * 60 * 60 = 604800 seconds)
    await redisService.set(key, data, { EX: 604800 });
  }

  /**
   * Authenticate a guest user, either by creating a new guest or validating an existing token.
   * If a token is provided and valid, returns existing player data.
   * Otherwise, creates a new guest player.
   */
  async authenticate(token?: string): Promise<{ token: string; elo: number }> {
    // If token is provided, try to verify it
    if (token) {
      const playerId = verifyGuestToken(token);
      if (playerId) {
        // Check if player exists in Redis
        const playerData = await this.getPlayerData(playerId);
        if (playerData) {
          // Player exists, generate new token and return existing ELO
          const newToken = signGuestToken(playerId);
          return {
            token: newToken,
            elo: playerData.elo
          };
        }
      }
    }

    // Create new guest player
    const playerId = generatePlayerId();
    const elo = this.defaultElo;
    await this.setPlayerData(playerId, elo);
    const newToken = signGuestToken(playerId);

    return {
      token: newToken,
      elo
    };
  }
}

const guestAuthService = new GuestAuthService();
export default guestAuthService;
