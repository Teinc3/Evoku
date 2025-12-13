/**
 * RatingCalculator handles ELO rating calculations for players after matches.
 * 
 * Implements the standard ELO rating system formula,
 * using a K-factor of 80 for high rating volatility.
 * Ratings are floored at 0 and cannot become negative.
 */
export default class RatingCalculator {
  private static readonly K = 80; // ELO constant, determines rating volatility

  /**
   * Calculates the ELO rating change for the winner in a match.
   * @param winnerElo Current ELO of the winner
   * @param loserElo Current ELO of the loser
   * @returns The ELO change (positive number)
   */
  static calculateEloChange(winnerElo: number, loserElo: number): number {
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const change = this.K * (1 - expectedWinner);
    return Math.round(change);
  }

  /**
   * Calculates the new ELO ratings for both winner and loser, and the change amount.
   * @param winnerElo Current ELO of the winner
   * @param loserElo Current ELO of the loser
   * @returns An object with new ELOs for winner and loser, and the ELO change.
   */
  static calculateEloUpdate(winnerElo: number, loserElo: number): {
    newWinnerElo: number;
    newLoserElo: number;
    eloChange: number;
  } {
    const eloChange = this.calculateEloChange(winnerElo, loserElo);
    const newWinnerElo = winnerElo + eloChange;
    const newLoserElo = Math.max(0, loserElo - eloChange);
    return { newWinnerElo, newLoserElo, eloChange };
  }
}
