import { ComponentFixture, TestBed } from '@angular/core/testing';

import GameStateModel from '../../../../models/GameState';
import DuelHudTopComponent from './duel-hud-top';


describe('DuelHudTopComponent', () => {
  let component: DuelHudTopComponent;
  let fixture: ComponentFixture<DuelHudTopComponent>;
  let gameState: GameStateModel;

  beforeEach(async () => {
    gameState = new GameStateModel();
    
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
    it('should return "You" when myID is null', () => {
      const gameState = new GameStateModel();
      gameState.myID = null;
      component.gameState = gameState;

      expect(component.myDisplayInfo).toBe('You');
    });

    it('should return username with "(You)" when player info exists', () => {
      const gameState = new GameStateModel();
      gameState.myID = 0;
      gameState.addPlayer(0, 'TestPlayer');
      component.gameState = gameState;

      expect(component.myDisplayInfo).toBe('TestPlayer (You)');
    });

    it('should return "You" when player info does not exist', () => {
      const gameState = new GameStateModel();
      gameState.myID = 0;
      // Don't set player info
      component.gameState = gameState;

      expect(component.myDisplayInfo).toBe('You');
    });
  });

  describe('opponentDisplayInfo getter', () => {
    it('should return "Opponent" when myID is null', () => {
      const gameState = new GameStateModel();
      gameState.myID = null;
      component.gameState = gameState;

      expect(component.opponentDisplayInfo).toBe('Opponent');
    });

    it('should return opponent username when opponent info exists', () => {
      const gameState = new GameStateModel();
      gameState.myID = 0;
      gameState.addPlayer(1, 'OpponentPlayer');
      component.gameState = gameState;

      expect(component.opponentDisplayInfo).toBe('OpponentPlayer');
    });

    it('should return "Opponent" when opponent info does not exist', () => {
      const gameState = new GameStateModel();
      gameState.myID = 0;
      // Don't set opponent info
      component.gameState = gameState;

      expect(component.opponentDisplayInfo).toBe('Opponent');
    });

    it('should return opponent username for player 2 when myID is 1', () => {
      const gameState = new GameStateModel();
      gameState.myID = 1;
      gameState.addPlayer(0, 'PlayerOne');
      component.gameState = gameState;

      expect(component.opponentDisplayInfo).toBe('PlayerOne');
    });
  });
});
