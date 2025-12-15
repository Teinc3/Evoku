import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { CombatOutcome } from '../../../../types/enums';
import FloatingTextComponent from './floating-text.component';


describe('FloatingTextComponent', () => {
  let component: FloatingTextComponent;
  let fixture: ComponentFixture<FloatingTextComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FloatingTextComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FloatingTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with empty floating texts', () => {
      expect(component.floatingTexts()).toEqual([]);
    });
  });

  describe('spawnText', () => {
    it('should add a floating text to the collection', () => {
      component.spawnText('TEST', CombatOutcome.REFLECTED);
      
      const texts = component.floatingTexts();
      expect(texts.length).toBe(1);
      expect(texts[0].text).toBe('TEST');
      expect(texts[0].outcome).toBe(CombatOutcome.REFLECTED);
    });

    it('should assign unique IDs to each floating text', () => {
      component.spawnText('TEXT1', CombatOutcome.REFLECTED);
      component.spawnText('TEXT2', CombatOutcome.HIT);
      
      const texts = component.floatingTexts();
      expect(texts.length).toBe(2);
      expect(texts[0].id).not.toBe(texts[1].id);
    });

    it('should remove text after duration expires', fakeAsync(() => {
      component.spawnText('TEST', CombatOutcome.REFLECTED);
      expect(component.floatingTexts().length).toBe(1);
      
      tick(2000); // Wait for FLOATING_TEXT_DURATION
      
      expect(component.floatingTexts().length).toBe(0);
    }));
  });

  describe('spawnReflected', () => {
    it('should spawn text with REFLECTED outcome', () => {
      component.spawnReflected('SHATTERED!');
      
      const texts = component.floatingTexts();
      expect(texts.length).toBe(1);
      expect(texts[0].text).toBe('SHATTERED!');
      expect(texts[0].outcome).toBe(CombatOutcome.REFLECTED);
    });

    it('should use default text when none provided', () => {
      component.spawnReflected();
      
      const texts = component.floatingTexts();
      expect(texts[0].text).toBe('REFLECTED!');
    });
  });

  describe('spawnHit', () => {
    it('should spawn text with HIT outcome', () => {
      component.spawnHit('FROZEN!');
      
      const texts = component.floatingTexts();
      expect(texts.length).toBe(1);
      expect(texts[0].text).toBe('FROZEN!');
      expect(texts[0].outcome).toBe(CombatOutcome.HIT);
    });

    it('should use default text when none provided', () => {
      component.spawnHit();
      
      const texts = component.floatingTexts();
      expect(texts[0].text).toBe('HIT!');
    });
  });

  describe('getOutcomeClass', () => {
    it('should return "outcome-reflected" for REFLECTED outcome', () => {
      expect(component.getOutcomeClass(CombatOutcome.REFLECTED)).toBe('outcome-reflected');
    });

    it('should return "outcome-hit" for HIT outcome', () => {
      expect(component.getOutcomeClass(CombatOutcome.HIT)).toBe('outcome-hit');
    });
  });

  describe('cleanup', () => {
    it('should clear all timeouts on destroy', fakeAsync(() => {
      component.spawnText('TEXT1', CombatOutcome.REFLECTED);
      component.spawnText('TEXT2', CombatOutcome.HIT);
      
      expect(component.floatingTexts().length).toBe(2);
      
      component.ngOnDestroy();
      
      // Should not throw after destroy, even after tick
      tick(2000);
    }));

    it('should handle multiple spawns and removes correctly', fakeAsync(() => {
      component.spawnText('TEXT1', CombatOutcome.REFLECTED);
      tick(500);
      
      component.spawnText('TEXT2', CombatOutcome.HIT);
      tick(500);
      
      component.spawnText('TEXT3', CombatOutcome.REFLECTED);
      
      expect(component.floatingTexts().length).toBe(3);
      
      tick(1000); // TEXT1 should be removed
      expect(component.floatingTexts().length).toBe(2);
      
      tick(500); // TEXT2 should be removed
      expect(component.floatingTexts().length).toBe(1);
      
      tick(500); // TEXT3 should be removed
      expect(component.floatingTexts().length).toBe(0);
    }));
  });
});
