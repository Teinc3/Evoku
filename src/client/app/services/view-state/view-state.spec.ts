import { TestBed } from '@angular/core/testing';

import { AppView } from '../../../types/enums';
import ViewStateService from '.';


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

  it('should navigate to view with data', () => {
    const testData = { message: 'test data', id: 123 };
    
    service.navigateToViewWithData(AppView.BOARD_DEMO, testData);
    
    expect(service.getCurrentView()).toBe(AppView.BOARD_DEMO);
    expect(service.currentView()).toBe(AppView.BOARD_DEMO);
  });

  it('should store and retrieve navigation data', () => {
    const testData = { message: 'test data', id: 123 };
    
    service.navigateToViewWithData(AppView.BOARD_DEMO, testData);
    const retrievedData = service.getNavigationData<typeof testData>();
    
    expect(retrievedData).toEqual(testData);
  });

  it('should return null when no navigation data exists', () => {
    const retrievedData = service.getNavigationData();
    
    expect(retrievedData).toBeNull();
  });

  it('should clear navigation data after retrieval', () => {
    const testData = { message: 'test data', id: 123 };
    
    service.navigateToViewWithData(AppView.BOARD_DEMO, testData);
    
    // First retrieval should return data
    const firstRetrieval = service.getNavigationData<typeof testData>();
    expect(firstRetrieval).toEqual(testData);
    
    // Second retrieval should return null
    const secondRetrieval = service.getNavigationData<typeof testData>();
    expect(secondRetrieval).toBeNull();
  });

  it('should handle different data types', () => {
    const stringData = 'string data';
    const numberData = 42;
    const objectData = { complex: 'object', nested: { value: true } };
    
    service.navigateToViewWithData(AppView.BOARD_DEMO, stringData);
    expect(service.getNavigationData<string>()).toBe(stringData);
    
    service.navigateToViewWithData(AppView.NETWORK_DEMO, numberData);
    expect(service.getNavigationData<number>()).toBe(numberData);
    
    service.navigateToViewWithData(AppView.CATALOGUE, objectData);
    expect(service.getNavigationData<typeof objectData>()).toEqual(objectData);
  });
});
