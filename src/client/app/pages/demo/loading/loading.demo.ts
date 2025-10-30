import { interval, Subscription, timer } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';

import pupConfig from '@config/shared/pup.json';
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
  private static readonly FRAME_INTERVAL_MS = 2000;
  private static readonly SEQUENCE = [0, 1, 2, 5];
  private static readonly TOTAL_CELLS = 9;
  private static readonly CANCEL_BUTTON_CELL_ID = 4;
  private static readonly FADE_TRANSITION_MS = 1200;
  private static readonly AUTO_TRANSITION_TIMEOUT_MS = 30000;
  private static readonly DOTS_INTERVAL_MS = 1000;
  private static readonly DOTS_PAUSE_MS = 3000;

  public AppView = AppView;

  protected readonly cells = Array.from(
    { length: LoadingDemoPageComponent.TOTAL_CELLS },
    (_, i) => ({
      id: i,
      isBlack: LoadingDemoPageComponent.SEQUENCE.includes(i), // Initial black cells (yin)
      pupIcon: null as string | null,
      pupName: null as string | null,
      opacity: 1
    })
  );

  private timer: number | null = null;
  private frameIndex = -1;
  private timeoutId: number | null = null;
  private dotsTimer: number | null = null;
  private currentDotsIndex = -1;
  private currentTooltipPupName: string | null = null;
  protected tooltipVisible = false;
  protected tooltipText = '';
  protected tooltipPosition = { x: 0, y: 0 };

  private animationSubscription: Subscription | null = null;
  private timeoutSubscription: Subscription | null = null;
  private dotsSubscription: Subscription | null = null;
  private pupConfigMap: Map<string, typeof pupConfig[0]> = new Map();

  constructor(public viewStateService: ViewStateService) {
    // Initialize pup config map for O(1) lookups
    pupConfig.forEach(pup => {
      this.pupConfigMap.set(pup.name, pup);
    });
  }

  get dots(): string {
    const dots = '.'.repeat(this.currentDotsIndex);
    const spaces = '\u00A0'.repeat(3 - dots.length); // Non-breaking spaces
    return dots + spaces;
  }

  private getAvailablePups(isYin: boolean): typeof pupConfig {
    return pupConfig.filter(pup => pup.theme === !isYin); // theme: false = yin, theme: true = yang
  }

  private getRandomAvailablePup(isYin: boolean): typeof pupConfig[0] | null {
    const availablePups = this.getAvailablePups(isYin);
    const usedPupNames = new Set(
      this.cells
        .filter(cell => cell.pupName !== null)
        .map(cell => cell.pupName!)
    );

    const unusedPups = availablePups.filter(pup => !usedPupNames.has(pup.name));

    if (unusedPups.length === 0) {
      return null; // No available pups
    }

    return unusedPups[Math.floor(Math.random() * unusedPups.length)];
  }

  private assignInitialPups(): void {
    for (const cell of this.cells) {
      if (cell.id !== LoadingDemoPageComponent.CANCEL_BUTTON_CELL_ID) { // Skip cancel button
        const pup = this.getRandomAvailablePup(cell.isBlack);
        if (pup) {
          cell.pupIcon = pup.asset.icon;
          cell.pupName = pup.name;
        }
      }
    }
  }

  ngOnInit(): void {
    this.assignInitialPups();
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
    this.animationSubscription = interval(
      LoadingDemoPageComponent.FRAME_INTERVAL_MS
    ).subscribe(() => {
      this.frameIndex = (this.frameIndex + 1) % LoadingDemoPageComponent.SEQUENCE.length;
      this.updateCellColors();
    });
  }

  private stopAnimation(): void {
    if (this.animationSubscription) {
      this.animationSubscription.unsubscribe();
      this.animationSubscription = null;
    }
  }

  private updateCellColors(): void {
    const elementToFlip = LoadingDemoPageComponent.SEQUENCE[this.frameIndex];
    const oppositeElement = LoadingDemoPageComponent.TOTAL_CELLS - 1 - elementToFlip;

    // Flip the colors of the current element and its opposite
    this.cells[elementToFlip].isBlack = !this.cells[elementToFlip].isBlack;
    this.cells[oppositeElement].isBlack = !this.cells[oppositeElement].isBlack;

    // Assign new pups for the flipped cells
    this.assignNewPupForCell(elementToFlip);
    this.assignNewPupForCell(oppositeElement);
  }

  private assignNewPupForCell(cellId: number): void {
    const cell = this.cells[cellId];
    const pup = this.getRandomAvailablePup(cell.isBlack);
    const newIcon = pup ? pup.asset.icon : null;
    const newName = pup ? pup.name : null;

    if (cell.pupIcon) {
      // Fade out current pup
      cell.opacity = 0;
      setTimeout(() => {
        cell.pupIcon = newIcon;
        cell.pupName = newName;
        cell.opacity = 1;
      },
      LoadingDemoPageComponent.FADE_TRANSITION_MS
      ); // Slightly longer than CSS transition duration to ensure fade out completes
    } else {
      // No current pup, just set new one
      cell.pupIcon = newIcon;
      cell.pupName = newName;
      cell.opacity = 1;
    }
  }

  private startTimeout(): void {
    this.timeoutSubscription = timer(
      LoadingDemoPageComponent.AUTO_TRANSITION_TIMEOUT_MS
    ).subscribe(() => {
      this.viewStateService.navigateToView(AppView.DUEL_DEMO);
    });
  }

  private clearTimeout(): void {
    if (this.timeoutSubscription) {
      this.timeoutSubscription.unsubscribe();
      this.timeoutSubscription = null;
    }
  }

  private startDotsAnimation(): void {
    const animateDots = () => {
      this.currentDotsIndex = (this.currentDotsIndex + 1) % 4;

      // Schedule next animation with appropriate delay
      const delay = this.currentDotsIndex === 3
        ? LoadingDemoPageComponent.DOTS_PAUSE_MS
        : LoadingDemoPageComponent.DOTS_INTERVAL_MS;
      this.dotsSubscription = timer(delay).subscribe(() => animateDots());
    };

    // Start the animation
    animateDots();
  }

  private stopDotsAnimation(): void {
    if (this.dotsSubscription) {
      this.dotsSubscription.unsubscribe();
      this.dotsSubscription = null;
    }
  }

  protected onCellClick(event: MouseEvent, cellId: number): void {
    // Don't show tooltip for the cancel button (cell 4)
    if (cellId === LoadingDemoPageComponent.CANCEL_BUTTON_CELL_ID) {
      return;
    }

    const cell = this.cells[cellId];
    if (cell.pupName === this.currentTooltipPupName) {
      // Clicking the same pup that's currently showing tooltip - close it
      this.hideTooltip();
      return;
    }

    // Different pup or no tooltip currently open
    if (cell.pupName) {
      const pup = this.pupConfigMap.get(cell.pupName);
      this.tooltipText = pup
        ? `${pup.name}: ${pup.description}`
        : 'No description available';
      this.currentTooltipPupName = cell.pupName;
    } else {
      this.tooltipText = 'No powerup selected';
      this.currentTooltipPupName = null;
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.tooltipPosition = {
      x: rect.left + rect.width / 2,
      y: rect.top - 10 // Position above the cell
    };

    this.tooltipVisible = true;
  }

  protected hideTooltip(): void {
    this.tooltipVisible = false;
    this.currentTooltipPupName = null;
  }
}
