import {
  Component, ElementRef, EventEmitter, HostBinding,
  HostListener, Input, OnDestroy, OnInit, Output, ViewChild
} from '@angular/core';

import { PUPOrbState } from '../../../../types/enums';


@Component({
  selector: 'app-pup-spinner',
  standalone: true,
  templateUrl: './pup-spinner.html',
  styleUrl: './pup-spinner.scss'
})
export default class PupSpinnerComponent implements OnInit, OnDestroy {
  @Input()
  set pupProgress(value: number) {
    this._pupProgress = value;
    // Only update idle contrast if not spinning/settling
    if (this.state !== PUPOrbState.SPINNING && this.state !== PUPOrbState.SETTLING) {
      this.updateIdleContrast();
    }
    if (this.state === PUPOrbState.IDLE && this._pupProgress >= 100) {
      this.state = PUPOrbState.READY;
    }
  }
  get pupProgress(): number {
    return this._pupProgress;
  }
  private _pupProgress = 0;

  @Input()
  disabled = false;
  @Output()
  roll = new EventEmitter<void>();

  @ViewChild('iconContainer', { static: true })
  iconContainer!: ElementRef<HTMLDivElement>;

  state: PUPOrbState = PUPOrbState.IDLE;
  public PUPOrbState = PUPOrbState;

  private cachedSvg: string | null = null;
  private animationTimeoutId: number | null = null;
  private settlingTimeoutId: number | null = null;
  private svgElement: SVGElement | null = null;
  private frameIndex = 0;
  
  // Animation constants
  private static readonly IDLE_FLIP_INTERVAL = 1000;
  private static readonly READY_FLIP_INTERVAL = 500;
  private static readonly SPINNING_FLIP_INTERVAL = 250;
  private static readonly SETTLING_FLIP_INTERVAL = 750;
  private static readonly SETTLING_TOTAL_MS = 5000;
  private static readonly ELEMENT_TYPES = ['wood', 'fire', 'earth', 'metal', 'water'];
  
  @HostBinding('attr.data-type')
  get dataType(): string | null {
    return this.settlingType;
  }

  private settlingType: string | null = null;

  constructor() {}

  ngOnInit(): void {
    this.loadSvg();
  }

  ngOnDestroy(): void {
    if (this.animationTimeoutId !== null) {
      clearTimeout(this.animationTimeoutId);
      this.animationTimeoutId = null;
    }

    if (this.settlingTimeoutId !== null) {
      clearTimeout(this.settlingTimeoutId);
      this.settlingTimeoutId = null;
    }
  }

  private contrastFromProgress(progress: number): number {
    const p = Math.max(0, Math.min(100, progress)) / 100;
    return 0.3 + (0.7 * p);
  }

  private pickFlipInterval(): number {
    if (this.state === PUPOrbState.SPINNING) {
      return PupSpinnerComponent.SPINNING_FLIP_INTERVAL;
    }

    if (this.state === PUPOrbState.SETTLING) {
      return PupSpinnerComponent.SETTLING_FLIP_INTERVAL;
    }

    if (this.state === PUPOrbState.READY) {
      return PupSpinnerComponent.READY_FLIP_INTERVAL;
    }

    if (this.pupProgress >= 100) {
      return PupSpinnerComponent.READY_FLIP_INTERVAL;
    }

    return PupSpinnerComponent.IDLE_FLIP_INTERVAL;
  }

  private beginSettling(targetIndex: number = 0): void {
    this.state = PUPOrbState.SETTLING;
    
    const typeIndex = Math.abs(targetIndex) % PupSpinnerComponent.ELEMENT_TYPES.length;
    this.settlingType = PupSpinnerComponent.ELEMENT_TYPES[typeIndex];

    if (this.settlingTimeoutId !== null) {
      clearTimeout(this.settlingTimeoutId);
    }
    this.settlingTimeoutId = setTimeout(() => {
      this.state = PUPOrbState.IDLE;
      this.settlingType = null;
      this.settlingTimeoutId = null;
      // Once back to idle, we can make the contrast back to progress
      // This should have been reset to 0
      // Earlier we prevented contrast update during spinning/settling as it would have been at 0
      this.updateIdleContrast();
    }, PupSpinnerComponent.SETTLING_TOTAL_MS);
  }

  private async loadSvg(): Promise<void> {
    try {
      const response = await fetch('/assets/icons/icon.svg');
      if (!response.ok) {
        throw new Error('Failed to load icon');
      }
      this.cachedSvg = await response.text();
      this.initSvg();
      this.startAnimation();
    } catch (error) {
      console.error('Error loading PUP spinner icon:', error);
    }
  }

  private initSvg(): void {
    if (!this.cachedSvg || !this.iconContainer) {
      return;
    }
    this.iconContainer.nativeElement.innerHTML = this.cachedSvg;
    // Ensure SVG fills container
    const svg = this.iconContainer.nativeElement.querySelector('svg');
    if (svg) {
      this.svgElement = svg;
      // Fix: Add viewBox to ensure scaling works, using original dimensions
      if (!svg.hasAttribute('viewBox')) {
        const w = svg.getAttribute('width') || '467';
        const h = svg.getAttribute('height') || '467';
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      
      // Remove hardcoded dimensions so CSS 100% takes over
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      
      this.updateIdleContrast();
    }
  }

  private updateIdleContrast(): void {
    if (!this.iconContainer) {
      return;
    }
    const idleContrast = this.contrastFromProgress(this.pupProgress);
    this.iconContainer.nativeElement.style.setProperty('--yy-contrast', String(idleContrast));
  }

  private startAnimation(): void {
    const step = () => {
      this.flipIcon();
      const interval = this.pickFlipInterval();
      this.animationTimeoutId = setTimeout(step, interval);
    };
    this.animationTimeoutId = setTimeout(step, this.pickFlipInterval());
  }

  private flipIcon(): void {
    if (!this.svgElement) {
      return;
    }

    const index = this.frameIndex;
    [index, index + 4].forEach(elementId => {
      const element = this.svgElement?.querySelector(`[id="p${elementId}"]`);
      if (!element) {
        return;
      }
      const currentFill = element.getAttribute('fill');
      const currentStroke = element.getAttribute('stroke');
      element.setAttribute('fill', currentStroke ?? '');
      element.setAttribute('stroke', currentFill ?? '');
    });
    this.frameIndex = (this.frameIndex + 1) % 4;
  }

  @HostBinding('attr.role') 
  role = 'button';
  @HostBinding('attr.tabindex') 
  tabindex = 0;
  @HostBinding('attr.aria-busy') 
  get ariaBusy(): string {
    return String(this.state === PUPOrbState.SPINNING || this.state === PUPOrbState.SETTLING);
  }
  @HostBinding('class.ready') 
  get isReady(): boolean {
    return this.state === PUPOrbState.READY;
  }

  @HostBinding('class.spinning')
  get isSpinning(): boolean {
    return this.state === PUPOrbState.SPINNING;
  }

  @HostBinding('class.settling')
  get isSettling(): boolean {
    return this.state === PUPOrbState.SETTLING;
  }

  @HostListener('click') 
  onClick(): void {
    if (this.disabled) {
      return;
    }

    // Testing cycle
    switch (this.state) {
      case PUPOrbState.IDLE:
        this.state = PUPOrbState.READY;
        break;
      case PUPOrbState.READY:
        this.state = PUPOrbState.SPINNING;
        this.roll.emit();
        break;
      case PUPOrbState.SPINNING:
        // Test with a random element
        this.beginSettling(Math.floor(Math.random() * 5));
        break;
      case PUPOrbState.SETTLING:
        this.state = PUPOrbState.IDLE;
        if (this.settlingTimeoutId !== null) {
          clearTimeout(this.settlingTimeoutId);
          this.settlingTimeoutId = null;
          this.settlingType = null;
        }
        break;
    }
  }
}
