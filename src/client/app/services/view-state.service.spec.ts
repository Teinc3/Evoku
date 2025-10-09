import { TestBed } from '@angular/core/testing';

import AppView from '../types/app-view.enum';
import ViewStateService from './view-state.service';


describe('ViewStateService', () => {
  let service: ViewStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ViewStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with CATALOGUE view', () => {
    expect(service.getCurrentView()).toBe(AppView.CATALOGUE);
    expect(service.currentView()).toBe(AppView.CATALOGUE);
  });

  it('should navigate to different views', () => {
    service.navigateToView(AppView.BOARD_DEMO);
    expect(service.getCurrentView()).toBe(AppView.BOARD_DEMO);
    expect(service.currentView()).toBe(AppView.BOARD_DEMO);

    service.navigateToView(AppView.NETWORK_DEMO);
    expect(service.getCurrentView()).toBe(AppView.NETWORK_DEMO);
    expect(service.currentView()).toBe(AppView.NETWORK_DEMO);

    service.navigateToView(AppView.CATALOGUE);
    expect(service.getCurrentView()).toBe(AppView.CATALOGUE);
    expect(service.currentView()).toBe(AppView.CATALOGUE);
  });

  it('should provide a readonly signal', () => {
    const readonlySignal = service.currentView;
    
    // The readonly signal should reflect the current state
    expect(readonlySignal()).toBe(AppView.CATALOGUE);
    
    // After navigation, the readonly signal should update
    service.navigateToView(AppView.BOARD_DEMO);
    expect(readonlySignal()).toBe(AppView.BOARD_DEMO);
  });

  it('should handle multiple rapid navigation calls', () => {
    service.navigateToView(AppView.BOARD_DEMO);
    service.navigateToView(AppView.NETWORK_DEMO);
    service.navigateToView(AppView.CATALOGUE);
    service.navigateToView(AppView.BOARD_DEMO);

    expect(service.getCurrentView()).toBe(AppView.BOARD_DEMO);
    expect(service.currentView()).toBe(AppView.BOARD_DEMO);
  });
});