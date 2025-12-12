import {
  Component,
  Input,
  OnInit,
  OnDestroy,
  ElementRef,
  Renderer2,
  ChangeDetectorRef
} from '@angular/core';

import FloatingTextType from '../../../types/enums/floating-text-type';

import type { FloatingTextData } from '../../../types/combat';


/** Animation duration in milliseconds - must match CSS animation */
const FLOAT_ANIMATION_DURATION = 2000;

@Component({
  selector: 'app-floating-text',
  standalone: true,
  imports: [],
  templateUrl: './floating-text.component.html',
  styleUrl: './floating-text.component.scss'
})
export default class FloatingTextComponent implements OnInit, OnDestroy {
  @Input() data!: FloatingTextData;
  @Input() onComplete!: (id: number) => void;

  /** Expose enum for template */
  public readonly FloatingTextType = FloatingTextType;

  private cleanupTimer: number | null = null;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.data || !this.onComplete) {
      console.error('FloatingTextComponent: Missing required inputs');
      return;
    }

    // Schedule cleanup after animation completes
    this.cleanupTimer = window.setTimeout(() => {
      this.cleanup();
    }, FLOAT_ANIMATION_DURATION);
  }

  ngOnDestroy(): void {
    // Clear timer if component is destroyed early
    if (this.cleanupTimer !== null) {
      window.clearTimeout(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Cleanup: notify parent to remove this component from DOM
   */
  private cleanup(): void {
    this.cleanupTimer = null;
    if (this.onComplete) {
      this.onComplete(this.data.id);
    }
  }

  /**
   * Get CSS class for text styling based on type
   */
  get textClass(): string {
    switch (this.data.type) {
      case FloatingTextType.REFLECTED:
      case FloatingTextType.SHATTERED:
        return 'success';
      case FloatingTextType.FROZEN:
      case FloatingTextType.LOCKED:
        return 'danger';
      default:
        return '';
    }
  }

  /**
   * Get display text
   */
  get displayText(): string {
    return this.data.type + '!';
  }
}
