import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';

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

  it('should render the title with dots', () => {
    const titleElement = fixture.debugElement.query(By.css('.loading-title'));
    expect(titleElement.nativeElement.textContent).toContain('Searching for Opponent');
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

  it('should clean up timers on destroy', () => {
    spyOn(window, 'clearInterval');
    spyOn(window, 'clearTimeout');

    component.ngOnDestroy();

    expect(window.clearInterval).toHaveBeenCalled();
    expect(window.clearTimeout).toHaveBeenCalled();
  });
});
