import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import pupConfig from '@config/shared/pup.json';
import ViewStateService from '../../../services/view-state.service';
import AppView from '../../../../types/enums/app-view.enum';
import LoadingDemoPageComponent from './loading.demo';


describe('LoadingDemoPageComponent', () => {
  let component: LoadingDemoPageComponent;
  let fixture: ComponentFixture<LoadingDemoPageComponent>;
  let viewStateServiceSpy: jasmine.SpyObj<ViewStateService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ViewStateService', ['navigateToView']);

    await TestBed.configureTestingModule({
      imports: [LoadingDemoPageComponent],
      providers: [
        { provide: ViewStateService, useValue: spy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingDemoPageComponent);
    component = fixture.componentInstance;
    viewStateServiceSpy = TestBed.inject(ViewStateService) as jasmine.SpyObj<ViewStateService>;
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

    component.ngOnDestroy();

    // Subscriptions should be cleaned up
    expect(component['animationSubscription']).toBeNull();
    expect(component['timeoutSubscription']).toBeNull();
    expect(component['dotsSubscription']).toBeNull();
  });

  it('should initialize component state on ngOnInit', () => {
    // Create a fresh component instance to test ngOnInit behavior
    const freshComponent = new LoadingDemoPageComponent(viewStateServiceSpy);

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
  });

  it('should filter pups correctly in getAvailablePups', () => {
    // Test Yin pups (theme: false)
    const yinPups = component['getAvailablePups'](true);
    expect(yinPups.every((pup: typeof pupConfig[0]) => pup.theme === false)).toBe(true);

    // Test Yang pups (theme: true)
    const yangPups = component['getAvailablePups'](false);
    expect(yangPups.every((pup: typeof pupConfig[0]) => pup.theme === true)).toBe(true);
  });

  it('should return null when no unused pups available', () => {
    // Fill all cells with all available Yin pups to exhaust options
    const yinPups = pupConfig.filter(pup => pup.theme === false); // Yin pups have theme: false
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
});
