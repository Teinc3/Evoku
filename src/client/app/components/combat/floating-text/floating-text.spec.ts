import { ComponentFixture, TestBed } from '@angular/core/testing';

import CombatFloatingTextComponent from './floating-text';
import type { CombatOutcomeText } from '../../../../types/combat';


describe('CombatFloatingTextComponent', () => {
  let fixture: ComponentFixture<CombatFloatingTextComponent>;
  let component: CombatFloatingTextComponent;

  const baseMessages: CombatOutcomeText[] = [
    {
      id: 'm1',
      text: 'REFLECTED',
      tone: 'reflected',
      createdAtMs: 1_000,
      expiresAtMs: 3_000
    },
    {
      id: 'm2',
      text: 'HIT',
      tone: 'hit',
      createdAtMs: 2_000,
      expiresAtMs: 5_000
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombatFloatingTextComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(CombatFloatingTextComponent);
    component = fixture.componentInstance;
    component.messages = baseMessages;
    component.currentTimeMs = 1_500;
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('filters out expired messages', () => {
    component.currentTimeMs = 3_500;
    fixture.detectChanges();
    const active = component.activeMessages;
    expect(active.length).toBe(1);
    expect(active[0].id).toBe('m2');
  });

  it('sorts messages by creation time', () => {
    const active = component.activeMessages;
    expect(active[0].id).toBe('m1');
    expect(active[1].id).toBe('m2');
  });
});
