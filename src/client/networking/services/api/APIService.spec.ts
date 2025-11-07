import APIService from '.';


describe('APIService', () => {
  let service: APIService;

  beforeEach(() => {
    service = new APIService();
  });

  describe('authenticateGuest', () => {
    it('should call API without token when no token provided', async () => {
      const mockResponse = {
        token: 'new-token',
        elo: 0,
        userID: 'test-user-id'
      };

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        } as Response)
      );

      const result = await service.authenticateGuest();

      expect(window.fetch).toHaveBeenCalledWith('/api/auth/guest', jasmine.objectContaining({
        method: 'POST',
        body: JSON.stringify({})
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should call API with token when token provided', async () => {
      const existingToken = 'existing-token';
      const mockResponse = {
        token: 'refreshed-token',
        elo: 1500,
        userID: 'test-user-id'
      };

      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        } as Response)
      );

      const result = await service.authenticateGuest(existingToken);

      expect(window.fetch).toHaveBeenCalledWith('/api/auth/guest', jasmine.objectContaining({
        method: 'POST',
        body: JSON.stringify({ token: existingToken })
      }));
      expect(result).toEqual(mockResponse);
    });

    it('should throw error when API returns non-ok status', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.resolve({
          ok: false,
          status: 500
        } as Response)
      );

      await expectAsync(service.authenticateGuest()).toBeRejectedWithError(
        'Guest auth failed with status 500'
      );
    });

    it('should throw error on network failure', async () => {
      spyOn(window, 'fetch').and.returnValue(
        Promise.reject(new Error('Network error'))
      );

      await expectAsync(service.authenticateGuest()).toBeRejectedWithError('Network error');
    });
  });
});
