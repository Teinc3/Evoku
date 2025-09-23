import { TestBed } from '@angular/core/testing';

import AppView from '../types/app-view';
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

  it('should initialize with MAIN_MENU view', () => {
    expect(service.getCurrentView()).toBe(AppView.MAIN_MENU);
    expect(service.currentView()).toBe(AppView.MAIN_MENU);
  });

  it('should navigate to different views', () => {
    service.navigateToView(AppView.BOARD_DEMO);
    expect(service.getCurrentView()).toBe(AppView.BOARD_DEMO);
    expect(service.currentView()).toBe(AppView.BOARD_DEMO);

    service.navigateToView(AppView.NETWORK_DEMO);
    expect(service.getCurrentView()).toBe(AppView.NETWORK_DEMO);
    expect(service.currentView()).toBe(AppView.NETWORK_DEMO);

    service.navigateToView(AppView.MAIN_MENU);
    expect(service.getCurrentView()).toBe(AppView.MAIN_MENU);
    expect(service.currentView()).toBe(AppView.MAIN_MENU);
  });

  it('should provide a readonly signal', () => {
    const readonlySignal = service.currentView;
    
    // The readonly signal should reflect the current state
    expect(readonlySignal()).toBe(AppView.MAIN_MENU);
    
    // After navigation, the readonly signal should update
    service.navigateToView(AppView.BOARD_DEMO);
    expect(readonlySignal()).toBe(AppView.BOARD_DEMO);
  });

  it('should handle multiple rapid navigation calls', () => {
    service.navigateToView(AppView.BOARD_DEMO);
    service.navigateToView(AppView.NETWORK_DEMO);
    service.navigateToView(AppView.MAIN_MENU);
    service.navigateToView(AppView.BOARD_DEMO);

    expect(service.getCurrentView()).toBe(AppView.BOARD_DEMO);
    expect(service.currentView()).toBe(AppView.BOARD_DEMO);
  });
});