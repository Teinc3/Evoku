import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombatDefuseType, type CombatIncomingThreat } from '../../../../types/combat';
import CombatBadgeComponent from './combat-badge';


describe('CombatBadgeComponent', () => {
  let fixture: ComponentFixture<CombatBadgeComponent>;
  let component: CombatBadgeComponent;

  const baseThreat: CombatIncomingThreat = {
    id: 't1',
    pupName: 'Cryo',
    icon: '/assets/pup/icons/cryo.svg',
    defuseType: CombatDefuseType.ROW,
    targetIndex: 2,
    createdAtMs: 1_000,
    expiresAtMs: 11_000
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatBadgeComponent);
    component = fixture.componentInstance;
    component.incoming = { ...baseThreat };
    component.currentTimeMs = 4_500;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('formats countdown text with seconds and hundredths', () => {
    // Remaining = 6.5s -> 06:50
    expect(component.countdownText).toBe('06:50');
  });

  it('returns 0 remaining when time not provided', () => {
    component.currentTimeMs = null;
    fixture.detectChanges();
    expect(component.remainingMs).toBe(0);
    expect(component.progressPercent).toBe(0);
  });

  it('computes progress percent based on duration', () => {
    // Duration 10s, remaining 6.5s => 65%
    expect(Math.round(component.progressPercent)).toBe(65);
  });

  it('shows critical when under 3 seconds', () => {
    component.currentTimeMs = 9_000;
    fixture.detectChanges();
    expect(component.isCritical).toBeTrue();
  });

  it('returns correct defuse label for each type', () => {
    component.incoming = { ...baseThreat, defuseType: CombatDefuseType.COL };
    fixture.detectChanges();
    expect(component.defuseLabel).toBe('Col Defuse');

    component.incoming = { ...baseThreat, defuseType: CombatDefuseType.BOX };
    fixture.detectChanges();
    expect(component.defuseLabel).toBe('Box Defuse');

    component.incoming = { ...baseThreat, defuseType: CombatDefuseType.GLOBAL };
    fixture.detectChanges();
    expect(component.defuseLabel).toBe('Global');

    component.incoming = null;
    fixture.detectChanges();
    expect(component.defuseLabel).toBe('Idle');
  });
});
