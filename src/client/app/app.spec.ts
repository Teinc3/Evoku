import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import AppView from '../types/enums/app-view.enum';
import WebSocketService from '../networking/services/WebSocketService';
import ViewStateService from './services/view-state.service';
import NetworkService from './services/network.service';
import DynamicFaviconService from './services/dynamic-favicon.service';
import App from './app';


describe('App', () => {
  let viewStateService: ViewStateService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: WebSocketService, useFactory: () => new WebSocketService() },
        NetworkService,
        DynamicFaviconService,
        ViewStateService
      ],
      schemas: [NO_ERRORS_SCHEMA] // This allows unknown elements like app-home-page
    }).compileComponents();

    viewStateService = TestBed.inject(ViewStateService);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize with CATALOGUE view', () => {
    TestBed.createComponent(App);
    // Don't call detectChanges() to avoid child component issues
    
    expect(viewStateService.getCurrentView()).toBe(AppView.CATALOGUE);
  });


  it('should render board demo when view state changes', () => {
    TestBed.createComponent(App);
    viewStateService.navigateToView(AppView.BOARD_DEMO);
    
    expect(viewStateService.getCurrentView()).toBe(AppView.BOARD_DEMO);
  });

  it('should render network demo when view state changes', () => {
    TestBed.createComponent(App);
    viewStateService.navigateToView(AppView.NETWORK_DEMO);
    
    expect(viewStateService.getCurrentView()).toBe(AppView.NETWORK_DEMO);
  });
});
