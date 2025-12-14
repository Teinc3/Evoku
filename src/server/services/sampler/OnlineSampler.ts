import type { StatsService } from '../stats';


/**
 * Sampler service that periodically records server statistics to Redis.
 * Samples every hour at xx:00:00.
 */
export default class OnlineSampler {
  private timer: NodeJS.Timeout | null = null;
  private initialTimeout: NodeJS.Timeout | null = null;

  constructor(private statsService: StatsService) {}

  /**
   * Start the sampler. It will align to the next hour boundary (:00:00)
   * and then sample every 60 minutes.
   */
  public start(referenceDate?: Date): void {
    if (this.timer || this.initialTimeout) {
      return; // Already running
    }

    // Calculate milliseconds until next hour
    const now = referenceDate ?? new Date();
    const msUntilNextHour = this.getDelayUntilNextHour(now);

    // Wait until next :00:00, then start the interval
    this.initialTimeout = setTimeout(() => {
      this.sample(); // Take first sample
      this.timer = setInterval(() => this.sample(), 3600_000); // Then every 60 minutes
    }, msUntilNextHour);
  }

  /** Stop the sampler */
  public stop(): void {
    if (this.initialTimeout) {
      clearTimeout(this.initialTimeout);
      this.initialTimeout = null;
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Take a sample and persist to Redis */
  private async sample(): Promise<void> {
    await this.statsService.sampleStats();
  }

  /** Compute delay to align next sample to the upcoming hour boundary */
  public getDelayUntilNextHour(reference: Date = new Date()): number {
    const minutesRemaining = 60 - reference.getMinutes();
    const seconds = reference.getSeconds();
    const milliseconds = reference.getMilliseconds();
    return minutesRemaining * 60 * 1000 - seconds * 1000 - milliseconds;
  }
}
