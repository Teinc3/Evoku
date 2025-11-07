import { TestBed } from '@angular/core/testing';

import CookieService from '.';


describe('CookieService', () => {
  let service: CookieService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CookieService]
    });
    service = TestBed.inject(CookieService);

    // Clear all cookies before each test
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const name = cookie.split('=')[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  });

  describe('get', () => {
    it('should return null when cookie does not exist', () => {
      const value = service.get('nonexistent');
      expect(value).toBeNull();
    });

    it('should return cookie value when it exists', () => {
      document.cookie = 'testCookie=testValue; path=/';
      const value = service.get('testCookie');
      expect(value).toBe('testValue');
    });

    it('should decode URI encoded values', () => {
      const encodedValue = encodeURIComponent('test value with spaces');
      document.cookie = `testCookie=${encodedValue}; path=/`;
      const value = service.get('testCookie');
      expect(value).toBe('test value with spaces');
    });
  });

  describe('set', () => {
    it('should set a cookie with the specified name and value', () => {
      service.set('testCookie', 'testValue', 3600);
      const value = service.get('testCookie');
      expect(value).toBe('testValue');
    });

    it('should encode URI values', () => {
      service.set('testCookie', 'test value with spaces', 3600);
      const value = service.get('testCookie');
      expect(value).toBe('test value with spaces');
    });
  });

  describe('delete', () => {
    it('should delete an existing cookie', () => {
      service.set('testCookie', 'testValue', 3600);
      expect(service.get('testCookie')).toBe('testValue');

      service.delete('testCookie');
      expect(service.get('testCookie')).toBeNull();
    });
  });
});
