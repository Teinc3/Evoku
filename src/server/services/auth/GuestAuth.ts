import redisService from '../redis';
import { generatePlayerId, signGuestToken, verifyGuestToken } from '../../utils/jwt';

import type { UUID } from 'crypto';
import type IGuestAuthResponse from '@shared/types/api/auth/guest-auth';


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
  private async setPlayerData(
    playerId: string, 
    elo: number, 
    extend: boolean = false
  ): Promise<void> {
    const key = `${this.redisKeyPrefix}${playerId}`;
    const data = JSON.stringify({ elo });
    if (extend) {
      // Set with 7 days expiration (7 * 24 * 60 * 60 = 604800 seconds)
      await redisService.set(key, data, { EX: 604800 });
    } else {
      // Update without changing expiration
      await redisService.set(key, data);
    }
  }

  /**
   * Authenticate a guest user, either by creating a new guest or validating an existing token.
   * If a token is provided and valid, returns existing player data with a refreshed token.
   * Otherwise, creates a new guest player.
   */
  async authenticate(token?: string): Promise<IGuestAuthResponse<UUID>> {
    // If token is provided, try to verify it
    if (token) {
      const playerId = verifyGuestToken(token);
      if (playerId) {
        // Check if player exists in Redis
        const playerData = await this.getPlayerData(playerId);
        if (playerData) {
          // Player exists, update data and extend expiration
          await this.setPlayerData(playerId, playerData.elo, true);
          const newToken = signGuestToken(playerId);
          return {
            token: newToken,
            elo: playerData.elo,
            userID: playerId
          };
        }
      }
    }

    // Create new guest player
    const playerID = generatePlayerId();
    const elo = this.defaultElo;
    await this.setPlayerData(playerID, elo, true); // Set with expiration for new players
    const newToken = signGuestToken(playerID);

    return {
      token: newToken,
      elo,
      userID: playerID
    };
  }
}

const guestAuthService = new GuestAuthService();
export default guestAuthService;
