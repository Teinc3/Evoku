import { Component, OnInit, OnDestroy } from '@angular/core';

import ViewStateService from '../../../services/view-state.service';
import AppView from '../../../../types/enums/app-view.enum';


/**
 * LoadingDemoPageComponent
 * Demonstrates the matchmaking loading screen with animated powerup grid
 * and cancel button functionality.
 */
@Component({
  selector: 'app-demo-loading',
  standalone: true,
  templateUrl: './loading.demo.html',
  styleUrl: './loading.demo.scss'
})
export default class LoadingDemoPageComponent implements OnInit, OnDestroy {
  private static readonly FRAME_INTERVAL_MS = 1500;
  private static readonly SEQUENCE = [0, 1, 2, 5];
  private static readonly TOTAL_CELLS = 9;

  public AppView = AppView;

  protected readonly cells = Array.from(
    { length: LoadingDemoPageComponent.TOTAL_CELLS },
    (_, i) => ({
      id: i,
      isBlack: [0, 1, 2, 5].includes(i) // Initial black cells
    })
  );

  private timer: number | null = null;
  private frameIndex = -1;
  private timeoutId: number | null = null;
  private dotsTimer: number | null = null;
  private currentDotsIndex = -1;
  protected tooltipVisible = false;
  protected tooltipText = '';
  protected tooltipPosition = { x: 0, y: 0 };

  constructor(public viewStateService: ViewStateService) {}

  get dots(): string {
    const dots = '.'.repeat(this.currentDotsIndex);
    const spaces = '\u00A0'.repeat(3 - dots.length); // Non-breaking spaces
    return dots + spaces;
  }

  ngOnInit(): void {
    this.startAnimation();
    this.startDotsAnimation();
    this.startTimeout();
  }

  ngOnDestroy(): void {
    this.stopAnimation();
    this.stopDotsAnimation();
    this.clearTimeout();
  }

  private startAnimation(): void {
    this.timer = window.setInterval(() => {
      this.frameIndex = (this.frameIndex + 1) % LoadingDemoPageComponent.SEQUENCE.length;
      this.updateCellColors();
    }, LoadingDemoPageComponent.FRAME_INTERVAL_MS);
  }

  private stopAnimation(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private updateCellColors(): void {
    const elementToFlip = LoadingDemoPageComponent.SEQUENCE[this.frameIndex];
    const oppositeElement = LoadingDemoPageComponent.TOTAL_CELLS - 1 - elementToFlip;

    // Flip the colors of the current element and its opposite
    this.cells[elementToFlip].isBlack = !this.cells[elementToFlip].isBlack;
    this.cells[oppositeElement].isBlack = !this.cells[oppositeElement].isBlack;
  }

  private startTimeout(): void {
    this.timeoutId = window.setTimeout(() => {
      this.viewStateService.navigateToView(AppView.DUEL_DEMO);
    }, 30000); // 30 seconds
  }

  private clearTimeout(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private startDotsAnimation(): void {
    const animateDots = () => {
      this.currentDotsIndex = (this.currentDotsIndex + 1) % 4;
      
      // Schedule next animation with appropriate delay
      const delay = this.currentDotsIndex === 3 ? 3000 : 1000; // 3s for 3 dots, 1s for others
      this.dotsTimer = window.setTimeout(animateDots, delay);
    };

    // Start the animation
    animateDots();
  }

  private stopDotsAnimation(): void {
    if (this.dotsTimer !== null) {
      clearTimeout(this.dotsTimer);
      this.dotsTimer = null;
    }
  }

  protected onCellClick(event: MouseEvent, cellId: number): void {
    // Don't show tooltip for the cancel button (cell 4)
    if (cellId === 4) {
      return;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.tooltipPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10 // Position above the cell
    };

    // Generate lorem ipsum text
    this.tooltipText = this.generateLoremIpsum();
    this.tooltipVisible = true;
  }

  protected hideTooltip(): void {
    this.tooltipVisible = false;
  }

  private generateLoremIpsum(): string {
    const loremTexts = [
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
      "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.",
      "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.",
      "Deserunt mollit anim id est laborum et dolorum fuga.",
      "Et harum quidem rerum facilis est et expedita distinctio.",
      "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil.",
      "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus.",
      "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis."
    ];

    return loremTexts[Math.floor(Math.random() * loremTexts.length)];
  }
}
