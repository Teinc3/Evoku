import { Component, Input, computed, signal } from '@angular/core';


@Component({
  selector: 'app-phase-timer',
  standalone: true,
  imports: [],
  templateUrl: './phase-timer.component.html',
  styleUrl: './phase-timer.component.scss'
})
export default class PhaseTimerComponent {
  // Geometry constants (SVG units, must match template)
  private static readonly OUTER_RADIUS = 50;
  /** Time in milliseconds to display as mm:ss (floored). */
  @Input()
  set timeMs(value: number) {
    const v = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
    this._timeMs.set(v);
  }

  /** Percentage (0-100) of the phase progress along the bottom arc. */
  @Input()
  set percentage(value: number) {
    const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    this._percentage.set(v);
  }

  // Internal reactive state
  protected _timeMs = signal(0);
  protected _percentage = signal(0);

  // Derived: stroke dashoffset (arc pathLength is normalized to 100)
  protected dashOffset = computed(() => 100 - this._percentage());

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

  /** Marker helpers: place at 150° and 241° */
  protected markerLeftTransform(): string {
    return this.markerTransformForClockAngle(150);
  }

  protected markerRightTransform(): string {
    return this.markerTransformForClockAngle(210);
  }

  private markerTransformForClockAngle(clockDeg: number): string {
    // Convert clock-style degrees (0° at 12 o'clock, clockwise) to SVG degrees (0° on +X, CCW)
    const svgDeg = clockDeg - 90;
    const rad = (svgDeg * Math.PI) / 180;
    const r = PhaseTimerComponent.OUTER_RADIUS;
    const x = r * Math.cos(rad);
    const y = r * Math.sin(rad);
    // Apply translate first, then rotate about the marker origin (x,y)
    // Rightmost operation runs first in SVG, so rotate(x,y) then translate(x,y)
    return `rotate(${svgDeg} ${x} ${y}) translate(${x} ${y})`;
  }
}