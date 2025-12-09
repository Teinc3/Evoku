import { signal } from '@angular/core';

import type { WritableSignal } from '@angular/core';


/**
 * Helper class managing cooldown animation state using CSS transitions.
 * Handles the visual countdown overlay that displays remaining cooldown time.
 */
export default class CooldownAnimationHelper {
  /** CSS transition duration signal for the overlay animation */
  public readonly transitionDuration: WritableSignal<string>;
  /** Current angle signal for the conic-gradient overlay (360deg to 0deg) */
  public readonly currentAngle: WritableSignal<number>;
  
  /** Last observed pending cooldown end timestamp for change detection */
  private lastPendingCooldownEnd?: number;
  /** Last observed confirmed cooldown end timestamp for change detection */
  private lastCooldownEnd?: number;
  
  /** Scheduled cleanup timer ID to force animation end when transitions complete */
  private cleanupTimer?: number;

  constructor() {
    this.transitionDuration = signal<string>('0s');
    this.currentAngle = signal<number>(0);
  }

  /**
   * Check for changes in cooldown timestamps and update animation accordingly.
   * Should be called from the component's ngDoCheck lifecycle hook.
   * 
   * @param pendingEnd - Pending cooldown end timestamp (optimistic update)
   * @param normalEnd - Confirmed cooldown end timestamp (server response)
   */
  public checkCooldownChanges(
    pendingEnd: number | undefined,
    normalEnd: number | undefined,
    now: number = performance.now()
  ): void {

    // Check if pendingEnd changed to a new value
    if (pendingEnd !== undefined && pendingEnd !== this.lastPendingCooldownEnd) {
      this.setAnimation(pendingEnd, true, now);
    }
    // Check if pendingEnd cleared and normalEnd changed
    else if (
      pendingEnd === undefined && normalEnd !== this.lastCooldownEnd
      && normalEnd !== undefined && normalEnd > now
    ) {
      this.setAnimation(normalEnd, false, now);
    }

    this.lastPendingCooldownEnd = pendingEnd;
    this.lastCooldownEnd = normalEnd;
  }

  private setAnimation(endTs: number, pending: boolean, now: number): void {
    this.clearCleanupTimer();

    const remaining = Math.max(0, endTs - now);
    this.transitionDuration.set(remaining / 1000 + 's');
    this.currentAngle.set(pending ? 360 : 0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.currentAngle.set(0);
      });
    });

    this.scheduleCleanupTimer(remaining);
  }

  private scheduleCleanupTimer(timeToFire: number): void {
    this.clearCleanupTimer();

    this.cleanupTimer = window.setTimeout(() => {
      this.transitionDuration.set('0s');
      this.currentAngle.set(0);
      this.cleanupTimer = undefined;
    }, timeToFire);
  }

  private clearCleanupTimer(): void {
    if (this.cleanupTimer !== undefined) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Immediately reset the animation state and clean up resources.
   * Useful when pending actions are rejected and animations need to be cleared,
   * or when the component is being destroyed from ngOnDestroy
   */
  public reset(): void {
    this.clearCleanupTimer();
    this.transitionDuration.set('0s');
    this.currentAngle.set(0);
  }
}
