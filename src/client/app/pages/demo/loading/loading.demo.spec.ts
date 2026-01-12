import { of, Observable } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { LobbyActions } from '@shared/types/enums/actions';
import pupConfig from '@config/shared/pup.json';
import ViewStateService from '../../../services/view-state';
import NetworkService from '../../../services/network';
import { AppView } from '../../../../types/enums';
import LoadingDemoPageComponent from './loading.demo';

import type { QueueUpdateContract, MatchFoundContract } from '@shared/types/contracts';


describe('LoadingDemoPageComponent', () => {
  let component: LoadingDemoPageComponent;
  let fixture: ComponentFixture<LoadingDemoPageComponent>;
  let viewStateServiceSpy: jasmine.SpyObj<ViewStateService>;
  let networkServiceSpy: jasmine.SpyObj<NetworkService>;

  beforeEach(async () => {
    // Mock console methods to prevent test output pollution
    spyOn(console, 'log');
    spyOn(console, 'warn');
    spyOn(console, 'error');

    const viewStateSpy = jasmine.createSpyObj('ViewStateService',
      ['navigateToView', 'navigateToViewWithData']);
    const networkSpy = jasmine.createSpyObj('NetworkService', [
      'connect',
      'disconnect',
      'send',
      'onPacket',
      'onDisconnect',
      'isConnected'
    ], {
      isConnected: true
    });

    // Mock connect to resolve successfully
    networkSpy.connect.and.resolveTo();

    // Mock onPacket to return empty observables by default
    networkSpy.onPacket.and.returnValue(of());

    // Mock onDisconnect to return empty observable
    networkSpy.onDisconnect.and.returnValue(of());

    await TestBed.configureTestingModule({
      imports: [LoadingDemoPageComponent],
      providers: [
        { provide: ViewStateService, useValue: viewStateSpy },
        { provide: NetworkService, useValue: networkSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingDemoPageComponent);
    component = fixture.componentInstance;
    viewStateServiceSpy = TestBed.inject(ViewStateService) as jasmine.SpyObj<ViewStateService>;
    networkServiceSpy = TestBed.inject(NetworkService) as jasmine.SpyObj<NetworkService>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the loading title', () => {
    const titleElement = fixture.debugElement.query(By.css('.loading-title'));
    expect(titleElement).toBeTruthy();
    expect(titleElement.nativeElement.textContent).toContain('Searching for Opponent');
  });

  it('should render the powerup grid with 9 cells', () => {
    const gridElement = fixture.debugElement.query(By.css('.powerup-grid'));
    expect(gridElement).toBeTruthy();

    const cells = fixture.debugElement.queryAll(By.css('.powerup-cell, .cancel-button'));
    expect(cells.length).toBe(9); // 8 powerup cells + 1 cancel button
  });

  it('should render the cancel button in the center position', () => {
    const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
    expect(cancelButton).toBeTruthy();
    expect(cancelButton.nativeElement.textContent).toContain('Cancel');
  });

  it('should render the loading fact', () => {
    const factElement = fixture.debugElement.query(By.css('.loading-fact'));
    expect(factElement).toBeTruthy();
    expect(factElement.nativeElement.textContent).toContain('Beta Testers');
  });

  it('should navigate to catalogue when cancel button is clicked', () => {
    const cancelButton = fixture.debugElement.query(By.css('.cancel-button'));
    cancelButton.nativeElement.click();

    expect(networkServiceSpy.send).toHaveBeenCalledWith(LobbyActions.LEAVE_QUEUE, {});
    expect(networkServiceSpy.disconnect).toHaveBeenCalled();
    expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.CATALOGUE);
  });

  it('should show tooltip when powerup cell is clicked', () => {
    // Find a cell with a powerup (should have an img element)
    const powerupCells = fixture.debugElement.queryAll(By.css('img.powerup-cell'));
    expect(powerupCells.length).toBeGreaterThan(0);

    const firstPowerupCell = powerupCells[0];
    firstPowerupCell.nativeElement.click();
    fixture.detectChanges();

    const tooltip = fixture.debugElement.query(By.css('.tooltip'));
    expect(tooltip).toBeTruthy();
  });

  it('should hide tooltip when clicking the tooltip itself', () => {
    // First show a tooltip
    const powerupCells = fixture.debugElement.queryAll(By.css('img.powerup-cell'));
    const firstPowerupCell = powerupCells[0];
    firstPowerupCell.nativeElement.click();
    fixture.detectChanges();

    let tooltip = fixture.debugElement.query(By.css('.tooltip'));
    expect(tooltip).toBeTruthy();

    // Then click the tooltip to hide it
    tooltip.nativeElement.click();
    fixture.detectChanges();

    tooltip = fixture.debugElement.query(By.css('.tooltip'));
    expect(tooltip).toBeFalsy();
  });

  it('should close tooltip when clicking the same powerup again', () => {
    const powerupCells = fixture.debugElement.queryAll(By.css('img.powerup-cell'));
    const firstPowerupCell = powerupCells[0];

    // First click - show tooltip
    firstPowerupCell.nativeElement.click();
    fixture.detectChanges();
    let tooltip = fixture.debugElement.query(By.css('.tooltip'));
    expect(tooltip).toBeTruthy();

    // Second click on same powerup - hide tooltip
    firstPowerupCell.nativeElement.click();
    fixture.detectChanges();
    tooltip = fixture.debugElement.query(By.css('.tooltip'));
    expect(tooltip).toBeFalsy();
  });

  it('should clean up subscriptions on ngOnDestroy', () => {
    component.ngOnInit(); // Initialize subscriptions

    // Verify subscriptions exist
    expect(component['animationSubscription']).toBeDefined();
    expect(component['timeoutSubscription']).toBeDefined();
    expect(component['dotsSubscription']).toBeDefined();
    expect(component['queueUpdateSubscription']).toBeDefined();
    expect(component['matchFoundSubscription']).toBeDefined();

    component.ngOnDestroy();

    // Subscriptions should be cleaned up
    expect(component['animationSubscription']).toBeNull();
    expect(component['timeoutSubscription']).toBeNull();
    expect(component['dotsSubscription']).toBeNull();
    expect(component['queueUpdateSubscription']).toBeNull();
    expect(component['matchFoundSubscription']).toBeNull();
  });

  it('should initialize component state on ngOnInit', () => {
    // Create a fresh component instance to test ngOnInit behavior
    const freshComponent = new LoadingDemoPageComponent(
      viewStateServiceSpy,
      networkServiceSpy
    );

    // Before ngOnInit, cells should be initialized but no pups assigned
    expect(freshComponent['cells'].length).toBe(9);
    expect(freshComponent['cells'][0].pupName).toBeNull();

    freshComponent.ngOnInit();

    // After ngOnInit, cells should have pups assigned (except cancel button)
    expect(freshComponent['cells'][0].pupName).toBeTruthy(); // Should have a pup
    expect(freshComponent['cells'][4].pupName).toBeNull(); // Cancel button should not have pup

    // Subscriptions should be created
    expect(freshComponent['animationSubscription']).toBeDefined();
    expect(freshComponent['timeoutSubscription']).toBeDefined();
    expect(freshComponent['dotsSubscription']).toBeDefined();
    expect(freshComponent['queueUpdateSubscription']).toBeDefined();
    expect(freshComponent['matchFoundSubscription']).toBeDefined();
  });

  it('should filter pups correctly in getAvailablePups', () => {
    // Test Yin pups (offensive: false)
    const yinPups = component['getAvailablePups'](true);
    expect(yinPups.every((pup: typeof pupConfig[0]) => pup.offensive === false)).toBe(true);

    // Test Yang pups (offensive: true)
    const yangPups = component['getAvailablePups'](false);
    expect(yangPups.every((pup: typeof pupConfig[0]) => pup.offensive === true)).toBe(true);
  });

  it('should return null when no unused pups available', () => {
    // Fill all cells with all available Yin pups to exhaust options
    const yinPups = pupConfig.filter(pup => pup.offensive === false); // Yin pups offensive: false
    let pupIndex = 0;

    component['cells'].forEach((cell: typeof component['cells'][0]) => {
      if (cell.id !== 4 && pupIndex < yinPups.length) {
        cell.pupName = yinPups[pupIndex].name;
        pupIndex++;
      }
    });

    const result = component['getRandomAvailablePup'](true); // true = isYin
    expect(result).toBeNull();
  });

  it('should assign initial pups correctly', () => {
    // Mock getRandomAvailablePup for predictable results
    const originalGetRandomAvailablePup = component['getRandomAvailablePup'];
    component['getRandomAvailablePup'] = jasmine.createSpy('getRandomAvailablePup')
      .and.returnValue({
        name: 'Test Pup',
        asset: { icon: '/test/icon.svg' }
      });

    component['assignInitialPups']();

    // Check that cancel button cell (id: 4) was skipped
    expect(component['cells'][4].pupIcon).toBeNull();
    expect(component['cells'][4].pupName).toBeNull();

    // Check that other cells got pups assigned
    component['cells'].forEach((cell: typeof component['cells'][0]) => {
      if (cell.id !== 4) {
        expect(cell.pupIcon).toBe('/test/icon.svg');
        expect(cell.pupName).toBe('Test Pup');
      }
    });

    // Restore original method
    component['getRandomAvailablePup'] = originalGetRandomAvailablePup;
  });

  it('should update cell colors and assign new pups', () => {
    // Mock assignNewPupForCell
    const originalAssignNewPupForCell = component['assignNewPupForCell'];
    component['assignNewPupForCell'] = jasmine.createSpy('assignNewPupForCell');

    // Set initial state
    component['cells'][0].isBlack = true;
    component['cells'][8].isBlack = false; // Opposite of 0 in 9-cell grid

    component['frameIndex'] = 0; // This will flip cells 0 and 8
    component['updateCellColors']();

    // Colors should be flipped
    expect(component['cells'][0].isBlack).toBe(false);
    expect(component['cells'][8].isBlack).toBe(true);

    // Should assign new pups for both cells
    expect(component['assignNewPupForCell']).toHaveBeenCalledWith(0);
    expect(component['assignNewPupForCell']).toHaveBeenCalledWith(8);

    // Restore original method
    component['assignNewPupForCell'] = originalAssignNewPupForCell;
  });

  it('should assign new pup for cell with fade transition', fakeAsync(() => {
    // Mock getRandomAvailablePup
    const originalGetRandomAvailablePup = component['getRandomAvailablePup'];
    const mockPup = { name: 'New Pup', asset: { icon: '/new/icon.svg' } };
    component['getRandomAvailablePup'] = jasmine.createSpy('getRandomAvailablePup')
      .and.returnValue(mockPup);

    // Set up cell with existing pup
    component['cells'][0].pupIcon = '/old/icon.svg';
    component['cells'][0].pupName = 'Old Pup';
    component['cells'][0].opacity = 1;

    component['assignNewPupForCell'](0);

    // Should fade out first
    expect(component['cells'][0].opacity).toBe(0);

    // Fast-forward time by the fade transition duration (1.2 seconds)
    tick(1200);

    expect(component['cells'][0].pupIcon).toBe('/new/icon.svg');
    expect(component['cells'][0].pupName).toBe('New Pup');
    expect(component['cells'][0].opacity).toBe(1);

    // Restore original method
    component['getRandomAvailablePup'] = originalGetRandomAvailablePup;
  }));

  it('should assign new pup for cell without existing pup', () => {
    // Mock getRandomAvailablePup
    const originalGetRandomAvailablePup = component['getRandomAvailablePup'];
    const mockPup = { name: 'New Pup', asset: { icon: '/new/icon.svg' } };
    component['getRandomAvailablePup'] = jasmine.createSpy('getRandomAvailablePup')
      .and.returnValue(mockPup);

    // Cell starts with no pup
    component['cells'][0].pupIcon = null;
    component['cells'][0].pupName = null;

    component['assignNewPupForCell'](0);

    // Should set immediately without fade
    const cell = component['cells'][0];
    expect(cell.pupIcon).toBe('/new/icon.svg');
    expect(cell.pupName).toBe('New Pup');
    expect(cell.opacity).toBe(1);

    // Restore original method
    component['getRandomAvailablePup'] = originalGetRandomAvailablePup;
  });

  it('should trigger animation callback after interval', fakeAsync(() => {
    // Store initial cell states
    const initialCell0Black = component['cells'][0].isBlack;
    const initialCell8Black = component['cells'][8].isBlack;

    component['startAnimation']();

    // Fast-forward time by the animation interval (2 seconds)
    tick(2000);

    // Cell colors should have changed (the animation flips cells 0 and 8)
    expect(component['cells'][0].isBlack).not.toBe(initialCell0Black);
    expect(component['cells'][8].isBlack).not.toBe(initialCell8Black);

    component['stopAnimation']();
  }));

  it('should handle cancel button click in onCellClick (no tooltip)', () => {
    // Mock hideTooltip to verify it's not called
    const originalHideTooltip = component['hideTooltip'];
    component['hideTooltip'] = jasmine.createSpy('hideTooltip');

    const mockEvent = { target: { getBoundingClientRect: () => ({}) } } as unknown as MouseEvent;
    component['onCellClick'](mockEvent, 4);

    // Should return early without showing tooltip
    expect(component['tooltipVisible']).toBe(false);
    expect(component['hideTooltip']).not.toHaveBeenCalled();

    // Restore original method
    component['hideTooltip'] = originalHideTooltip;
  });

  it('should show tooltip with "No powerup selected" when cell has no pup', () => {
    // Create a fresh component instance to avoid initial pup assignment
    const freshComponent = new LoadingDemoPageComponent(
      viewStateServiceSpy,
      networkServiceSpy
    );

    // Mock assignInitialPups to do nothing
    const originalAssignInitialPups = freshComponent['assignInitialPups'];
    const mockAssignInitialPups = jasmine.createSpy('assignInitialPups').and.callFake(() => {
      // Do nothing - leave cells without pups
    });
    freshComponent['assignInitialPups'] = mockAssignInitialPups;

    // Initialize component without pups
    freshComponent.ngOnInit();

    // Ensure cell has no pup and no tooltip is currently showing
    freshComponent['cells'][0].pupName = null;
    freshComponent['currentTooltipPupName'] = ''; // Set to empty string so null !== ''

    const mockEvent = {
      target: { getBoundingClientRect: () => ({ left: 100, width: 50, top: 200 }) }
    } as unknown as MouseEvent;
    freshComponent['onCellClick'](mockEvent, 0);

    expect(freshComponent['tooltipText']).toBe('No powerup selected');
    expect(freshComponent['tooltipVisible']).toBe(true);
    expect(freshComponent['currentTooltipPupName']).toBeNull();

    // Restore original method
    freshComponent['assignInitialPups'] = originalAssignInitialPups;
  });

  it('should show tooltip with "No description available" when pup not found in map', () => {
    // Set up cell with pup name that doesn't exist in map
    component['cells'][0].pupName = 'NonExistentPup';

    const mockEvent = {
      target: { getBoundingClientRect: () => ({ left: 100, width: 50, top: 200 }) }
    } as unknown as MouseEvent;
    component['onCellClick'](mockEvent, 0);

    expect(component['tooltipText']).toBe('No description available');
    expect(component['tooltipVisible']).toBe(true);
    expect(component['currentTooltipPupName']).toBe('NonExistentPup');
  });

  it('should handle connection failure in connectAndJoinQueue', async () => {
    // Mock networkService.connect to throw an error
    networkServiceSpy.connect.and.rejectWith(new Error('Connection failed'));

    // Create a fresh component to test the connection failure
    const freshComponent = new LoadingDemoPageComponent(
      viewStateServiceSpy,
      networkServiceSpy
    );

    // Start the connection process
    await freshComponent['connectAndJoinQueue']();

    // Should set error message and stop animations
    expect(freshComponent['errorMessage']).toBe('Failed to connect to server');
    expect(freshComponent['animationSubscription']).toBeNull();
    expect(freshComponent['dotsSubscription']).toBeNull();
  });

  it('should generate guest username with proper format', () => {
    // Mock Math.random to return a predictable value
    spyOn(Math, 'random').and.returnValue(0.01234);

    const username = component['generateGuestUsername']();

    expect(username).toBe('Guest 0123');
  });

  it('should handle queue update packets correctly', async () => {
    // Mock onPacket to return observable with queue update data
    const queueUpdateData: QueueUpdateContract = { inQueue: true, onlineCount: 42 };
    networkServiceSpy.onPacket.and.returnValue(of(queueUpdateData));

    // Create fresh component and call connectAndJoinQueue to set up subscriptions
    const freshComponent = new LoadingDemoPageComponent(
      viewStateServiceSpy,
      networkServiceSpy
    );

    // Call connectAndJoinQueue to set up the subscriptions
    await freshComponent['connectAndJoinQueue']();

    // Should have received the online count
    expect(freshComponent['onlineCount']).toBe(42);
  });

  it('should handle match found packets correctly', async () => {
    // Mock onPacket to return observable with match found data
    const matchData: MatchFoundContract = { myID: 0, players: [] };
    networkServiceSpy.onPacket.and.returnValue(of(matchData));

    // Create fresh component and call connectAndJoinQueue to set up subscriptions
    const freshComponent = new LoadingDemoPageComponent(
      viewStateServiceSpy,
      networkServiceSpy
    );

    // Call connectAndJoinQueue to set up the subscriptions
    await freshComponent['connectAndJoinQueue']();

    // Should navigate to duel demo with match data
    expect(viewStateServiceSpy.navigateToViewWithData).toHaveBeenCalledWith(
      AppView.DUEL_DEMO,
      matchData
    );
  });

  it('should handle disconnection events correctly', () => {
    const freshComponent = new LoadingDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
    let disconnectCallback: () => void;

    // Mock onDisconnect to capture the callback
    networkServiceSpy.onDisconnect.and.returnValue({
      subscribe: (callback: () => void) => {
        disconnectCallback = callback;
        return { unsubscribe: jasmine.createSpy('unsubscribe') };
      }
    } as unknown as Observable<void>);

    freshComponent.ngOnInit();

    // Trigger disconnect
    disconnectCallback!();

    expect(freshComponent['errorMessage']).toBe('Connection lost to server, please try again.');
    expect(freshComponent['animationSubscription']).toBeNull();
    expect(freshComponent['dotsSubscription']).toBeNull();
  });

  it('should unsubscribe from disconnection events on destroy', () => {
    const freshComponent = new LoadingDemoPageComponent(viewStateServiceSpy, networkServiceSpy);
    const unsubscribeSpy = jasmine.createSpy('unsubscribe');

    // Mock onDisconnect to return subscription with unsubscribe spy
    networkServiceSpy.onDisconnect.and.returnValue({
      subscribe: () => ({ unsubscribe: unsubscribeSpy })
    } as unknown as Observable<void>);

    freshComponent.ngOnInit();
    freshComponent.ngOnDestroy();

    expect(unsubscribeSpy).toHaveBeenCalled();
  });
});
