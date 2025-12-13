import RatingCalculator from './RatingCalculator';


describe('RatingCalculator', () => {
  describe('calculateEloChange', () => {
    it('should calculate correct change for equal rated players', () => {
      const change = RatingCalculator.calculateEloChange(1000, 1000);
      expect(change).toBe(40); // K * (1 - 0.5) = 80 * 0.5 = 40
    });

    it('should calculate correct change when winner has higher rating', () => {
      const change = RatingCalculator.calculateEloChange(1200, 1000);
      // Expected: 1 / (1 + 10^((1000-1200)/400)) ≈ 0.76
      // Change: 80 * (1 - 0.76) ≈ 19.2, rounded to 19
      expect(change).toBe(19);
    });

    it('should calculate correct change when winner has lower rating', () => {
      const change = RatingCalculator.calculateEloChange(1000, 1200);
      // Expected: 1 / (1 + 10^((1200-1000)/400)) ≈ 0.24
      // Change: 80 * (1 - 0.24) ≈ 60.8, rounded to 61
      expect(change).toBe(61);
    });

    it('should return integer values', () => {
      const change = RatingCalculator.calculateEloChange(1050, 950);
      expect(Number.isInteger(change)).toBe(true);
    });
  });

  describe('getNewWinnerElo', () => {
    it('should return correct new ELO for winner', () => {
      const newElo = RatingCalculator.getNewWinnerElo(1000, 1000);
      expect(newElo).toBe(1040); // 1000 + 40
    });
  });

  describe('getNewLoserElo', () => {
    it('should return correct new ELO for loser', () => {
      const newElo = RatingCalculator.getNewLoserElo(1000, 1000);
      expect(newElo).toBe(960); // 1000 - 40
    });

    it('should not decrease ELO below 0', () => {
      const newElo = RatingCalculator.getNewLoserElo(5, 0);
      expect(newElo).toBe(0); // 5 - 41 = -36, floored to 0
    });
  });
});
