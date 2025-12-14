import { Component, Input, computed, signal, OnInit, OnDestroy } from '@angular/core';


@Component({
  selector: 'app-phase-timer',
  standalone: true,
  imports: [],
  templateUrl: './phase-timer.component.html',
  styleUrl: './phase-timer.component.scss'
})
export default class PhaseTimerComponent implements OnInit, OnDestroy {
  // Geometry constants (SVG units, must match template)
  private static readonly OUTER_RADIUS = 50;
  private static readonly MARKER_LEFT_ANGLE = 150;
  private static readonly MARKER_RIGHT_ANGLE = 210;
  private static readonly UPDATE_INTERVAL_MS = 100;

  private _startTime: number | null = null;
  private intervalId: number | null = null;

  /** Start time in milliseconds (performance.now() basis). */
  @Input()
  set startTime(value: number | null) {
    this._startTime = value;
    this.updateTime();
  }

  /** Percentage (0-100) of the phase progress along the bottom arc. */
  @Input()
  set percentage(value: number) {
    const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    this._percentage.set(v);
  }

  /** Phase index (0, 1, 2) to determine hue shift. */
  @Input()
  set phase(value: number) {
    this._phase.set(value);
  }

  // Internal reactive state
  protected _timeMs = signal(0);
  protected _percentage = signal(0);
  protected _phase = signal(0);

  ngOnInit() {
    this.intervalId = setInterval(() => this.updateTime(), PhaseTimerComponent.UPDATE_INTERVAL_MS);
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTime() {
    if (this._startTime === null) {
      this._timeMs.set(0);
      return;
    }
    const now = performance.now();
    const elapsed = Math.max(0, Math.floor(now - this._startTime));
    this._timeMs.set(elapsed);
  }

  // Derived: stroke dashoffset (arc pathLength is normalized to 100)
  protected dashOffset = computed(() => 100 - this._percentage());

  // Derived: hue rotation filter for the time gradient
  protected hueRotateFilter = computed(() => {
    const shifts = [0, 200, 170]; // Blue, Yellow, Orange-Red
    return `hue-rotate(${shifts[this._phase()]}deg)`;
  });

  // Derived: mm:ss string
  protected timeText = computed(() => {
    const ms = this._timeMs();
    const totalSec = Math.floor(ms / 1000);
    const mm = Math.floor(totalSec / 60);
    const ss = totalSec % 60;
    const mmStr = mm.toString().padStart(2, '0');
    const ssStr = ss.toString().padStart(2, '0');
    return `${mmStr}:${ssStr}`;
  });

  /** Marker helpers: place at 150° and 210° */
  protected markerLeftTransform(): string {
    return this.markerTransformForClockAngle(PhaseTimerComponent.MARKER_LEFT_ANGLE);
  }

  protected markerRightTransform(): string {
    return this.markerTransformForClockAngle(PhaseTimerComponent.MARKER_RIGHT_ANGLE);
  }

  private markerTransformForClockAngle(clockDeg: number): string {
    // Convert clock-style degrees (0° at 12 o'clock, clockwise) to SVG degrees (0° on +X, CCW)
    const svgDeg = clockDeg - 90;
    const rad = (svgDeg * Math.PI) / 180;
    const r = PhaseTimerComponent.OUTER_RADIUS;
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    // Translate to the point on the circle, then rotate into position.
    return `translate(${x} ${y}) rotate(${svgDeg})`;
  }
}
