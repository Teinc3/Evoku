import { Injectable, signal } from '@angular/core';

import AppView from '../../types/enums/app-view.enum';


/**
 * Service for managing application view state without relying on router.
 * Uses Angular signals for reactive state management.
 */
@Injectable({
  providedIn: 'root'
})
export default class ViewStateService {
  /** Current application view state using Angular signal */
  private readonly _currentView = signal<AppView>(AppView.CATALOGUE);

  /** Public readonly accessor for the current view signal */
  public readonly currentView = this._currentView.asReadonly();

  /**
   * Navigate to a specific view by updating the state
   * @param view The target view to navigate to
   */
  navigateToView(view: AppView): void {
    this._currentView.set(view);
  }

  /**
   * Get the current view value synchronously
   * @returns Current AppView value
   */
  getCurrentView(): AppView {
    return this._currentView();
  }
}