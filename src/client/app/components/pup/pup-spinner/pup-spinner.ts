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
  pupProgress = 0; // 0 to 100
  @Input()
  disabled = false;
  @Output()
  roll = new EventEmitter<void>();

  @ViewChild('iconContainer', { static: true })
  iconContainer!: ElementRef<HTMLDivElement>;

  state: PUPOrbState = PUPOrbState.IDLE;
  public PUPOrbState = PUPOrbState;

  private cachedSvg: string | null = null;
  private animationFrameId: number | null = null;
  
  // Animation state
  private lastStepTime = 0;
  private stepCount = 0;
  
  // Animation constants
  private static readonly IDLE_FRAME_INTERVAL = 400; // Slower for idle
  private static readonly ACTIVE_FRAME_INTERVAL = 100; // 100ms per frame for active spin
  
  // Elemental Colors (HSL)
  private static readonly ELEMENTAL_COLORS = [
    'hsl(200, 90%, 55%)', // Water
    'hsl(125, 60%, 45%)', // Wood
    'hsl(20, 90%, 55%)',  // Fire
    'hsl(50, 95%, 55%)',  // Earth
    'hsl(210, 6%, 70%)'   // Metal
  ];

  // Sequence for the "Flip" animation (Perimeter trace)
  private static readonly SEQUENCE = [0, 1, 2, 4, 7, 6, 5, 3];
  private static readonly OPPOSITE_MAX_INDEX = 7;

  // Cell indices for the 8 cells (0-7)
  private readonly CELLS = [0, 1, 2, 3, 4, 5, 6, 7];

  constructor() {}

  ngOnInit(): void {
    this.loadSvg();
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private async loadSvg(): Promise<void> {
    try {
      const response = await fetch('/assets/icons/icon.svg');
      if (!response.ok) throw new Error('Failed to load icon');
      this.cachedSvg = await response.text();
      this.renderSvg();
      this.startAnimationLoop();
    } catch (error) {
      console.error('Error loading PUP spinner icon:', error);
    }
  }

  private renderSvg(): void {
    if (!this.cachedSvg || !this.iconContainer) return;
    this.iconContainer.nativeElement.innerHTML = this.cachedSvg;
    // Ensure SVG fills container
    const svg = this.iconContainer.nativeElement.querySelector('svg');
    if (svg) {
      // Fix: Add viewBox to ensure scaling works, using original dimensions
      if (!svg.hasAttribute('viewBox')) {
        const w = svg.getAttribute('width') || '467';
        const h = svg.getAttribute('height') || '467';
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      
      // Remove hardcoded dimensions so CSS 100% takes over
      svg.removeAttribute('width');
      svg.removeAttribute('height');

      svg.style.width = '100%';
      svg.style.height = '100%';

      // Initialize Colors for all cells to ensure no empty tiles
      this.CELLS.forEach((id, index) => {
        const el = svg.querySelector(`[id="p${id}"]`);
        if (el) {
          // Assign distinct colors for fill and stroke
          el.setAttribute('fill', PupSpinnerComponent.ELEMENTAL_COLORS[index % 5]);
          el.setAttribute('stroke', PupSpinnerComponent.ELEMENTAL_COLORS[(index + 2) % 5]);
        }
      });
    }
  }

  private startAnimationLoop(): void {
    const loop = (timestamp: number) => {
      // Initialize lastStepTime on first frame
      if (this.lastStepTime === 0) this.lastStepTime = timestamp;

      this.updateVisuals(timestamp);
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  private updateVisuals(timestamp: number): void {
    if (!this.iconContainer) return;
    const svg = this.iconContainer.nativeElement.querySelector('svg');
    if (!svg) return;

    // 1. Handle Saturation & Brightness
    const isReady = this.state === PUPOrbState.READY;
    const isSpinning = this.state === PUPOrbState.SPINNING;
    
    let saturation = 1;
    let brightness = 1;
    
    if (this.state === PUPOrbState.IDLE) {
      saturation = this.pupProgress / 100;
      brightness = 1.0;
    } else if (isReady) {
      saturation = 1;
      brightness = 1.5;
    } else if (isSpinning) {
      saturation = 1;
      brightness = 1.0;
    }
    
    svg.style.filter = `grayscale(${1 - saturation}) brightness(${brightness})`;

    // 2. Animation (Flip) - Active in ALL states
    const stepDuration = isSpinning 
      ? PupSpinnerComponent.ACTIVE_FRAME_INTERVAL 
      : PupSpinnerComponent.IDLE_FRAME_INTERVAL;

    if (timestamp - this.lastStepTime >= stepDuration) {
      this.stepCount++;
      this.lastStepTime = timestamp;
        
      const sequenceIndex = this.stepCount % PupSpinnerComponent.SEQUENCE.length;
      const elementToFlipId = PupSpinnerComponent.SEQUENCE[sequenceIndex];
        
      [elementToFlipId, PupSpinnerComponent.OPPOSITE_MAX_INDEX - elementToFlipId].forEach(id => {
        const el = svg.querySelector(`[id="p${id}"]`);
        if (el) {
          const currentFill = el.getAttribute('fill');
          const currentStroke = el.getAttribute('stroke');
            
          // Swap fill and stroke
          // Ensure we don't swap in nulls (shouldn't happen due to init)
          el.setAttribute('fill', currentStroke || PupSpinnerComponent.ELEMENTAL_COLORS[0]);
          el.setAttribute('stroke', currentFill || PupSpinnerComponent.ELEMENTAL_COLORS[1]);
        }
      });
    }
  }

  @HostBinding('attr.role') 
  role = 'button';
  @HostBinding('attr.tabindex') 
  tabindex = 0;
  @HostBinding('attr.aria-busy') 
  get ariaBusy(): string {
    return String(this.state === PUPOrbState.SPINNING);
  }
  @HostBinding('class.ready') 
  get isReady(): boolean {
    return this.state === PUPOrbState.READY;
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
        this.state = PUPOrbState.IDLE;
        break;
    }
  }
}
