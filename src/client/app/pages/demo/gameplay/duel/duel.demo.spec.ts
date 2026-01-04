import { Subject, Subscription } from 'rxjs';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import PUPElements from '@shared/types/enums/elements';
import ViewStateService from '../../../../services/view-state';
import NetworkService from '../../../../services/network';
import { AppView } from '../../../../../types/enums';
import { DuelActionDispatcher, DuelActionListener } from '../../../../../game/handlers';
import DuelDemoPageComponent from './duel.demo';

import type { MatchFoundContract } from '@shared/types/contracts';
import type {
  MatchActionListenerContext,
} from '../../../../../types/handlers/MatchActionListenerContext';


describe('DuelDemoPageComponent', () => {
  let fixture: ComponentFixture<DuelDemoPageComponent>;
  let component: DuelDemoPageComponent;
  let viewStateServiceSpy: jasmine.SpyObj<ViewStateService>;
  let networkServiceSpy: jasmine.SpyObj<NetworkService>;
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
    networkServiceSpy = TestBed.inject(NetworkService) as jasmine.SpyObj<NetworkService>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should navigate to catalogue on disconnect', () => {
    disconnectSubject.next();
    expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.CATALOGUE);
  });

  it('should wire access contexts and listener context on view init', () => {
    const newFixture = TestBed.createComponent(DuelDemoPageComponent);
    const newComponent = newFixture.componentInstance;

    const duelActionDispatcher = newFixture.debugElement.injector.get(DuelActionDispatcher);
    const duelActionListener = newFixture.debugElement.injector.get(DuelActionListener);

    let myBoardAccess: {
      selected: () => number | null;
      getCellValue: (cellIndex: number) => number | null;
    } | undefined;
    let enemyBoardAccess: {
      selected: () => number | null;
      getCellValue: (cellIndex: number) => number | null;
    } | undefined;
    let pupSlotShake: ((slotIndex: number) => void) | undefined;

    spyOn(duelActionDispatcher, 'setAccessContexts').and.callFake((my, enemy, shake) => {
      myBoardAccess = my;
      enemyBoardAccess = enemy;
      pupSlotShake = shake;
    });

    let listenerContext: MatchActionListenerContext | undefined;
    spyOn(duelActionListener, 'setContext').and.callFake(context => {
      listenerContext = context;
    });

    const board1 = {
      selected: () => 10,
      model: {
        board: [{ value: 1 }]
      },
      handleCellRejection: jasmine.createSpy('handleCellRejection'),
    };
    const board2 = {
      selected: () => 20,
      model: {
        board: [{ value: 2 }]
      },
    };
    const myPupSlots = {
      shakeSlot: jasmine.createSpy('shakeSlot')
    };

    const pupSpinner = {
      beginSettling: jasmine.createSpy('beginSettling'),
      setSettlingType: jasmine.createSpy('setSettlingType'),
    };

    newComponent.board1 = board1 as unknown as typeof newComponent.board1;
    newComponent.board2 = board2 as unknown as typeof newComponent.board2;
    newComponent.myPupSlots = myPupSlots as unknown as typeof newComponent.myPupSlots;
    newComponent.pupSpinner = pupSpinner as unknown as typeof newComponent.pupSpinner;

    newComponent.ngAfterViewInit();

    if (!myBoardAccess || !enemyBoardAccess || !pupSlotShake) {
      throw new Error('Expected access contexts to be set.');
    }

    expect(myBoardAccess.selected()).toBe(10);
    expect(enemyBoardAccess.selected()).toBe(20);
    expect(myBoardAccess.getCellValue(0)).toBe(1);
    expect(enemyBoardAccess.getCellValue(0)).toBe(2);
    expect(myBoardAccess.getCellValue(1234)).toBeNull();
    expect(enemyBoardAccess.getCellValue(1234)).toBeNull();

    pupSlotShake(2);
    expect(myPupSlots.shakeSlot).toHaveBeenCalledWith(2);

    if (!listenerContext?.onDisconnect) {
      throw new Error('Expected listener onDisconnect to be set.');
    }

    listenerContext.onDisconnect();
    expect(networkServiceSpy.disconnect).toHaveBeenCalled();
    expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.CATALOGUE);

    if (!listenerContext.onCellRejection) {
      throw new Error('Expected listener onCellRejection to be set.');
    }
    listenerContext.onCellRejection(5, 9);
    expect(board1.handleCellRejection).toHaveBeenCalledWith(5, 9);

    if (!listenerContext.onBeginPupSettling) {
      throw new Error('Expected listener onBeginPupSettling to be set.');
    }
    listenerContext.onBeginPupSettling();
    expect(pupSpinner.beginSettling).toHaveBeenCalled();

    if (!listenerContext.onSetPupSettlingType) {
      throw new Error('Expected listener onSetPupSettlingType to be set.');
    }
    listenerContext.onSetPupSettlingType(PUPElements.WATER);
    expect(pupSpinner.setSettlingType).toHaveBeenCalledWith(PUPElements.WATER);
  });

  it('should unsubscribe listener binding on destroy', () => {
    const newFixture = TestBed.createComponent(DuelDemoPageComponent);
    const newComponent = newFixture.componentInstance;

    const duelActionListener = newFixture.debugElement.injector.get(DuelActionListener);

    const bindSubscription = new Subscription();
    const bindUnsubscribeSpy = spyOn(bindSubscription, 'unsubscribe').and.callThrough();
    spyOn(duelActionListener, 'bind').and.returnValue(bindSubscription);

    newFixture.detectChanges();

    newComponent.ngOnDestroy();

    expect(bindUnsubscribeSpy).toHaveBeenCalled();
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
