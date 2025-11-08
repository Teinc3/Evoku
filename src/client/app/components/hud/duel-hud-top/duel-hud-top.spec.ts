import { ComponentFixture, TestBed } from '@angular/core/testing';

import GameStateManager from '../../../../game/GameStateManager';
import DuelHudTopComponent from './duel-hud-top';


describe('DuelHudTopComponent', () => {
  let component: DuelHudTopComponent;
  let fixture: ComponentFixture<DuelHudTopComponent>;
  let gameState: GameStateManager;

  beforeEach(async () => {
    gameState = new GameStateManager(2);
    
    await TestBed.configureTestingModule({
      imports: [DuelHudTopComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DuelHudTopComponent);
    component = fixture.componentInstance;
    component.gameState = gameState;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  describe('myDisplayInfo getter', () => {
    it('should return username with "(You)" when player info exists', () => {
      const gameState = new GameStateManager(2);
      gameState.myID = 0;
      gameState.playerInfo.get(0)!.username = 'TestPlayer';
      component.gameState = gameState;

      expect(component.myDisplayInfo).toBe('TestPlayer (You)');
    });

    it('should return "You" when player info has empty username', () => {
      const gameState = new GameStateManager(2);
      gameState.myID = 0;
      // Username is already empty from zombie initialization
      component.gameState = gameState;

      expect(component.myDisplayInfo).toBe('You');
    });
  });

  describe('opponentDisplayInfo getter', () => {
    it('should return opponent username when opponent info exists', () => {
      const gameState = new GameStateManager(2);
      gameState.myID = 0;
      gameState.playerInfo.get(1)!.username = 'OpponentPlayer';
      component.gameState = gameState;

      expect(component.opponentDisplayInfo).toBe('OpponentPlayer');
    });

    it('should return "Opponent" when opponent info has empty username', () => {
      const gameState = new GameStateManager(2);
      gameState.myID = 0;
      // Username is already empty from zombie initialization
      component.gameState = gameState;

      expect(component.opponentDisplayInfo).toBe('Opponent');
    });

    it('should return opponent username for player 2 when myID is 1', () => {
      const gameState = new GameStateManager(2);
      gameState.myID = 1;
      gameState.playerInfo.get(0)!.username = 'PlayerOne';
      component.gameState = gameState;

      expect(component.opponentDisplayInfo).toBe('PlayerOne');
    });
  });
});
