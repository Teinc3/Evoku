import type IGuestAuthResponse from '@shared/types/api/auth/guest-auth';


/**
 * Service for making HTTP API requests to the server.
 * Handles authentication and other REST API endpoints.
 */
export default class APIService {
  /**
   * Authenticate as a guest user
   * If a token is provided, validates and refreshes it
   * Otherwise, creates a new guest user
   */
  async authenticateGuest(token?: string): Promise<IGuestAuthResponse> {
    const body = token ? { token } : {};

    const headers = new Headers();
    headers.append('Content-Type', 'application/json');

    const response = await fetch('/api/auth/guest', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Guest auth failed with status ${response.status}`);
    }

    return response.json() as Promise<IGuestAuthResponse>;
  }
}
