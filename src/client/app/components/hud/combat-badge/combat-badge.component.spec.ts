import { ComponentFixture, TestBed } from '@angular/core/testing';

import DefuseType from '../../../../types/enums/defuse-type';
import CombatBadgeComponent from './combat-badge.component';

import type { ThreatData } from '../../../../types/combat';


describe('CombatBadgeComponent', () => {
  let component: CombatBadgeComponent;
  let fixture: ComponentFixture<CombatBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatBadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render when threatData is null', () => {
    component.threatData = null;
    fixture.detectChanges();
    
    const badge = fixture.nativeElement.querySelector('.combat-badge');
    expect(badge).toBeNull();
  });

  it('should render with threat data', () => {
    const threatData: ThreatData = {
      pupIcon: '/test.svg',
      defuseType: DefuseType.ROW,
      timeRemainingMs: 5000
    };
    component.threatData = threatData;
    fixture.detectChanges();
    
    const badge = fixture.nativeElement.querySelector('.combat-badge');
    expect(badge).toBeTruthy();
  });

  it('should format timer correctly', () => {
    const threatData: ThreatData = {
      pupIcon: '/test.svg',
      defuseType: DefuseType.ROW,
      timeRemainingMs: 3400
    };
    component.threatData = threatData;
    fixture.detectChanges();
    
    expect(component.timerDisplay()).toBe('3.4s');
  });

  it('should mark as critical when time < 3s', () => {
    const threatData: ThreatData = {
      pupIcon: '/test.svg',
      defuseType: DefuseType.ROW,
      timeRemainingMs: 2500
    };
    component.threatData = threatData;
    fixture.detectChanges();
    
    expect(component.isCritical()).toBe(true);
  });

  it('should not mark as critical when time >= 3s', () => {
    const threatData: ThreatData = {
      pupIcon: '/test.svg',
      defuseType: DefuseType.ROW,
      timeRemainingMs: 3000
    };
    component.threatData = threatData;
    fixture.detectChanges();
    
    expect(component.isCritical()).toBe(false);
  });

  it('should return correct defuse icon path for each type', () => {
    const testCases: Array<[DefuseType, string]> = [
      [DefuseType.ROW, '/assets/icons/defuse-row.svg'],
      [DefuseType.COL, '/assets/icons/defuse-col.svg'],
      [DefuseType.BOX, '/assets/icons/defuse-box.svg'],
      [DefuseType.GLOBAL, '/assets/icons/defuse-global.svg']
    ];

    testCases.forEach(([type, expectedPath]) => {
      component.threatData = {
        pupIcon: '/test.svg',
        defuseType: type,
        timeRemainingMs: 5000
      };
      expect(component.defuseIcon).toBe(expectedPath);
    });
  });
});
