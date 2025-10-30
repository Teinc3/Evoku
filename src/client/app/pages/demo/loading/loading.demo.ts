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

  public AppView = AppView;

  protected readonly cells = Array.from(
    { length: LoadingDemoPageComponent.TOTAL_CELLS },
    (_, i) => ({
      id: i,
      isBlack: [0, 1, 2, 5].includes(i), // Initial black cells (yin)
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

  constructor(public viewStateService: ViewStateService) {}

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
      if (cell.id !== 4) { // Skip cancel button
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
      }, 1200); // Slightly longer than CSS transition duration to ensure fade out completes
    } else {
      // No current pup, just set new one
      cell.pupIcon = newIcon;
      cell.pupName = newName;
      cell.opacity = 1;
    }
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

    const cell = this.cells[cellId];
    if (cell.pupName === this.currentTooltipPupName) {
      // Clicking the same pup that's currently showing tooltip - close it
      this.hideTooltip();
      return;
    }

    // Different pup or no tooltip currently open
    if (cell.pupName) {
      const pup = pupConfig.find(p => p.name === cell.pupName);
      this.tooltipText = pup ? `${pup.name}: ${pup.description}` : 'No description available';
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
