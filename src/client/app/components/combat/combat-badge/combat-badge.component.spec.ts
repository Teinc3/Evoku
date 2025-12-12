import { ComponentFixture, TestBed } from '@angular/core/testing';

import CombatBadgeComponent, { type CombatBadgeData } from './combat-badge.component';


describe('CombatBadgeComponent', () => {
  let component: CombatBadgeComponent;
  let fixture: ComponentFixture<CombatBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatBadgeComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatBadgeComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('shouldFlash', () => {
    it('should return false when data is null', () => {
      component.data = null;
      expect(component.shouldFlash).toBe(false);
    });

    it('should return true when timeRemaining < FLASH_THRESHOLD_MS', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'row',
        timeRemaining: 2999
      };
      expect(component.shouldFlash).toBe(true);
    });

    it('should return false when timeRemaining >= FLASH_THRESHOLD_MS', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'row',
        timeRemaining: 3000
      };
      expect(component.shouldFlash).toBe(false);
    });
  });

  describe('defuseIcon', () => {
    it('should return empty string when data is null', () => {
      component.data = null;
      expect(component.defuseIcon).toBe('');
    });

    it('should return → for row defuse type', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'row',
        timeRemaining: 5000
      };
      expect(component.defuseIcon).toBe('→');
    });

    it('should return ↓ for col defuse type', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'col',
        timeRemaining: 5000
      };
      expect(component.defuseIcon).toBe('↓');
    });

    it('should return ⊞ for box defuse type', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'box',
        timeRemaining: 5000
      };
      expect(component.defuseIcon).toBe('⊞');
    });
  });

  describe('formattedTime', () => {
    it('should return 00:00 when data is null', () => {
      component.data = null;
      expect(component.formattedTime).toBe('00:00');
    });

    it('should format time correctly for 8730ms', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'row',
        timeRemaining: 8730
      };
      expect(component.formattedTime).toBe('08:73');
    });

    it('should format time correctly for 0ms', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'row',
        timeRemaining: 0
      };
      expect(component.formattedTime).toBe('00:00');
    });

    it('should format time correctly for 59990ms', () => {
      component.data = {
        pupIcon: '/test.svg',
        defuseType: 'row',
        timeRemaining: 59990
      };
      expect(component.formattedTime).toBe('59:99');
    });
  });
});
