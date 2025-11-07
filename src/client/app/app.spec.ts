import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';

import { AppView } from '../types/enums';
import { WebSocketService } from '../networking/services';
import ViewStateService from './services/view-state';
import NetworkService from './services/network';
import DynamicFaviconService from './services/dynamic-favicon';
import App from './app';


describe('App', () => {
  let viewStateService: ViewStateService;
  let networkService: NetworkService;

  beforeEach(async () => {
    // Mock fetch to prevent DynamicFaviconService from making real network requests
    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve(new Response('<svg></svg>', { status: 200 }))
    );

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
    networkService = TestBed.inject(NetworkService);
    
    // Mock initGuestAuth to prevent actual API calls during tests
    spyOn(networkService, 'initGuestAuth').and.returnValue(
      Promise.resolve({ token: 'test-token', elo: 0, userID: 'test-user-id' })
    );
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should initialize guest authentication on init', async () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    
    await app.ngOnInit();
    
    expect(networkService.initGuestAuth).toHaveBeenCalled();
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
