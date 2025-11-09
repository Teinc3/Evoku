import { Injectable, signal } from '@angular/core';

import { AppView } from '../../../types/enums';


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

  /** Temporary navigation data storage during state transitions */
  private navigationData: Map<string, unknown> = new Map();

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
   * Navigate to a specific view with data
   * @param view The target view to navigate to
   * @param data The data to pass to the target view
   */
  navigateToViewWithData<DType>(view: AppView, data: DType): void {
    this._currentView.set(view);
    // Store data with the view key for retrieval
    this.navigationData.set(view.toString(), data);
  }

  /**
   * Get navigation data for the current view and clear it
   * @returns The navigation data or null if none exists
   */
  getNavigationData<DType>(): DType | null {
    const viewKey = this._currentView().toString();
    const data = this.navigationData.get(viewKey);
    if (data !== undefined) {
      this.navigationData.delete(viewKey);
      return data as DType;
    }
    return null;
  }

  /**
   * Get the current view value synchronously
   * @returns Current AppView value
   */
  getCurrentView(): AppView {
    return this._currentView();
  }
}
