import { Injectable, signal, computed } from '@angular/core';

import pupConfig from '@config/shared/pup.json';
import { createEmptySlotState } from '../../../types/pup';
import { PUPOrbState } from '../../../types/enums';

import type { WritableSignal, Signal } from '@angular/core';
import type { PupSlotState } from '../../../types/pup';


/** Number of available PUP slots */
const MAX_SLOTS = 3;


/**
 * Service managing PUP (Powerup) state for a player.
 * Handles rolling for new PUPs, equipping, using, and cooldowns.
 */
@Injectable({
  providedIn: 'root'
})
export default class PupStateService {
  /** Current state of the orb spinner */
  readonly orbState: WritableSignal<PUPOrbState> = signal(PUPOrbState.IDLE);

  /** State of all PUP slots */
  readonly slots: WritableSignal<PupSlotState[]> = signal(
    Array.from({ length: MAX_SLOTS }, () => createEmptySlotState())
  );

  /** Action ID of pending draw request, or null if not pending */
  private pendingDrawActionID: number | null = null;

  /** Whether all slots are occupied */
  readonly allSlotsOccupied: Signal<boolean> = computed(() => {
    return this.slots().every(slot => slot.pupID !== null);
  });

  /** Whether rolling is allowed (orb ready and slots available) */
  readonly canRoll: Signal<boolean> = computed(() => {
    return this.orbState() === PUPOrbState.READY && !this.allSlotsOccupied();
  });

  /**
   * Sets the orb to READY state when progress bar is full.
   */
  setReady(): void {
    if (this.orbState() === PUPOrbState.IDLE && !this.allSlotsOccupied()) {
      this.orbState.set(PUPOrbState.READY);
    }
  }

  /**
   * Sets the orb back to IDLE state (e.g., when progress resets).
   */
  setIdle(): void {
    this.orbState.set(PUPOrbState.IDLE);
    this.pendingDrawActionID = null;
  }

  /**
   * Initiates a roll (DRAW_PUP). Returns the action ID for the request.
   * Called when the orb is clicked in READY state.
   * @returns The action ID if roll started, null if cannot roll
   */
  startRoll(actionID: number): number | null {
    if (!this.canRoll()) {
      return null;
    }

    this.orbState.set(PUPOrbState.SPINNING);
    this.pendingDrawActionID = actionID;
    return actionID;
  }

  /**
   * Handles the PUP_DRAWN response from server.
   * @param actionID The action ID from the server response
   * @param pupID The PUP ID that was drawn
   */
  onPupDrawn(actionID: number, pupID: number): void {
    // Verify this is our pending action
    if (this.pendingDrawActionID !== actionID) {
      return;
    }

    this.pendingDrawActionID = null;

    // Find an empty slot
    const currentSlots = this.slots();
    const emptySlotIndex = currentSlots.findIndex(slot => slot.pupID === null);

    if (emptySlotIndex === -1) {
      // No empty slots - this shouldn't happen
      this.orbState.set(PUPOrbState.IDLE);
      return;
    }

    // Update the slot with the drawn PUP
    const newSlots = [...currentSlots];
    newSlots[emptySlotIndex] = {
      pupID,
      level: 1, // TODO: Get level from server when implemented
      onCooldown: false,
      cooldownEnd: null
    };
    this.slots.set(newSlots);

    // Reset orb state - if all slots full, go to IDLE; otherwise stay READY for next roll
    if (this.allSlotsOccupied()) {
      this.orbState.set(PUPOrbState.IDLE);
    } else {
      this.orbState.set(PUPOrbState.IDLE);
    }
  }

  /**
   * Handles rejection of a DRAW_PUP action.
   * @param actionID The action ID that was rejected
   */
  onDrawRejected(actionID: number): void {
    if (this.pendingDrawActionID === actionID) {
      this.pendingDrawActionID = null;
      // Return to READY state so player can try again
      this.orbState.set(PUPOrbState.READY);
    }
  }

  /**
   * Uses a PUP in the specified slot.
   * @param slotIndex The slot index (0-2)
   * @returns The PUP ID if usable, null otherwise
   */
  usePup(slotIndex: number): number | null {
    const currentSlots = this.slots();
    const slot = currentSlots[slotIndex];

    if (!slot || slot.pupID === null || slot.onCooldown) {
      return null;
    }

    return slot.pupID;
  }

  /**
   * Marks a PUP as used and starts its cooldown.
   * @param slotIndex The slot index
   * @param cooldownDuration Cooldown duration in ms
   */
  startCooldown(slotIndex: number, cooldownDuration: number): void {
    const currentSlots = this.slots();
    if (slotIndex < 0 || slotIndex >= currentSlots.length) {
      return;
    }

    const newSlots = [...currentSlots];
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      onCooldown: true,
      cooldownEnd: Date.now() + cooldownDuration
    };
    this.slots.set(newSlots);
  }

  /**
   * Clears a PUP from a slot after it's been used.
   * @param slotIndex The slot index
   */
  clearSlot(slotIndex: number): void {
    const currentSlots = this.slots();
    if (slotIndex < 0 || slotIndex >= currentSlots.length) {
      return;
    }

    const newSlots = [...currentSlots];
    newSlots[slotIndex] = createEmptySlotState();
    this.slots.set(newSlots);
  }

  /**
   * Gets PUP config data by ID.
   * @param pupID The PUP ID
   */
  getPupConfig(pupID: number): typeof pupConfig[number] | null {
    if (pupID < 0 || pupID >= pupConfig.length) {
      return null;
    }
    return pupConfig[pupID];
  }

  /**
   * Gets the icon path for a PUP.
   * @param pupID The PUP ID
   */
  getPupIcon(pupID: number): string | null {
    const config = this.getPupConfig(pupID);
    return config?.asset?.icon ?? null;
  }

  /**
   * Resets all PUP state (for new game).
   */
  reset(): void {
    this.orbState.set(PUPOrbState.IDLE);
    this.slots.set(Array.from({ length: MAX_SLOTS }, () => createEmptySlotState()));
    this.pendingDrawActionID = null;
  }
}
