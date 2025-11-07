import { Injectable } from '@angular/core';


/**
 * Service for managing browser cookies.
 * Provides methods to get and set cookies with secure defaults.
 */
@Injectable({ providedIn: 'root' })
export default class CookieService {
  /**
   * Get a cookie value by name
   */
  get(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, value] = cookie.trim().split('=');
      if (cookieName === name) {
        return decodeURIComponent(value);
      }
    }
    return null;
  }

  /**
   * Set a cookie with secure defaults
   */
  set(name: string, value: string, maxAgeSeconds: number): void {
    const secure = window.location.protocol === 'https:' ? 'Secure;' : '';
    document.cookie = `${name}=${encodeURIComponent(value)}; ` +
      `max-age=${maxAgeSeconds}; path=/; SameSite=Strict; ${secure}`;
  }

  /**
   * Delete a cookie by name
   */
  delete(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  }
}
