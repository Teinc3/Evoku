import { Subject } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import { AppView } from '../../../../../types/enums';
import DuelDemoPageComponent from './duel.demo';

import type { MatchFoundContract } from '@shared/types/contracts';


describe('DuelDemoPageComponent', () => {
  let fixture: ComponentFixture<DuelDemoPageComponent>;
  let component: DuelDemoPageComponent;
  let viewStateServiceSpy: jasmine.SpyObj<ViewStateService>;
  let disconnectSubject: Subject<void>;

  beforeEach(async () => {
    disconnectSubject = new Subject<void>();

    const viewStateSpy = jasmine.createSpyObj('ViewStateService', ['navigateToView'], {
      getNavigationData: jasmine.createSpy('getNavigationData')
    });

    const networkSpy = jasmine.createSpyObj(
      'NetworkService',
      ['send', 'onDisconnect', 'onPacket', 'disconnect']
    );
    networkSpy.onDisconnect.and.returnValue(disconnectSubject.asObservable());
    networkSpy.onPacket.and.returnValue(new Subject<unknown>().asObservable());

    await TestBed.configureTestingModule({
      imports: [DuelDemoPageComponent],
      providers: [
        { provide: ViewStateService, useValue: viewStateSpy },
        { provide: NetworkService, useValue: networkSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DuelDemoPageComponent);
    component = fixture.componentInstance;
    viewStateServiceSpy = TestBed.inject(ViewStateService) as jasmine.SpyObj<ViewStateService>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to catalogue on disconnect', () => {
    disconnectSubject.next();
    expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.CATALOGUE);
  });

  it('should set match data when navigation data exists', () => {
    const mockMatchData: MatchFoundContract = {
      myID: 0,
      players: [
        { playerID: 0, username: 'Player1', elo: 1000 },
        { playerID: 1, username: 'Player2', elo: 1000 }
      ]
    };

    (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(mockMatchData);

    const newFixture = TestBed.createComponent(DuelDemoPageComponent);
    const newComponent = newFixture.componentInstance;
    spyOn(newComponent.gameState, 'createGame');

    newComponent.ngOnInit();

    expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
    expect(newComponent.gameState.createGame).toHaveBeenCalledWith(mockMatchData);
  });

  it('should not set match data when navigation data is null', () => {
    (viewStateServiceSpy.getNavigationData as jasmine.Spy).and.returnValue(null);

    const newFixture = TestBed.createComponent(DuelDemoPageComponent);
    const newComponent = newFixture.componentInstance;
    spyOn(newComponent.gameState, 'createGame');

    newComponent.ngOnInit();

    expect(viewStateServiceSpy.getNavigationData).toHaveBeenCalled();
    expect(newComponent.gameState.createGame).not.toHaveBeenCalled();
  });

  it('should clear other board cursor on selection change', () => {
    const board1 = {
      selected: {
        set: jasmine.createSpy('set')
      }
    };

    const board2 = {
      selected: {
        set: jasmine.createSpy('set')
      }
    };

    component.board1 = board1 as unknown as typeof component.board1;
    component.board2 = board2 as unknown as typeof component.board2;

    component.onBoardSelectionChanged(0);
    expect(board2.selected.set).toHaveBeenCalledWith(null);

    component.onBoardSelectionChanged(1);
    expect(board1.selected.set).toHaveBeenCalledWith(null);
  });
});
