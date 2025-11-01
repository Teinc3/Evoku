import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import LobbyActions from '@shared/types/enums/actions/system/lobby';
import ViewStateService from '../../../services/view-state.service';
import NetworkService from '../../../services/network.service';
import AppView from '../../../../types/enums/app-view.enum';
import CatalogueDemoComponent from './catalogue.demo';


describe('CatalogueDemoComponent', () => {
  let component: CatalogueDemoComponent;
  let fixture: ComponentFixture<CatalogueDemoComponent>;
  let viewStateServiceSpy: jasmine.SpyObj<ViewStateService>;
  let networkServiceSpy: jasmine.SpyObj<NetworkService>;

  beforeEach(async () => {
    const viewStateSpy = jasmine.createSpyObj('ViewStateService', ['navigateToView']);
    const networkSpy = jasmine.createSpyObj('NetworkService', ['connect', 'send'], {
      isConnected: false
    });
    networkSpy.connect.and.returnValue(Promise.resolve());

    await TestBed.configureTestingModule({
      imports: [CatalogueDemoComponent],
      providers: [
        { provide: ViewStateService, useValue: viewStateSpy },
        { provide: NetworkService, useValue: networkSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogueDemoComponent);
    component = fixture.componentInstance;
    viewStateServiceSpy = TestBed.inject(ViewStateService) as jasmine.SpyObj<ViewStateService>;
    networkServiceSpy = TestBed.inject(NetworkService) as jasmine.SpyObj<NetworkService>;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should start matchmaking when Duel Mode button is clicked', fakeAsync(() => {
    component.startMatchmaking();
    tick();

    // Should connect to server
    expect(networkServiceSpy.connect).toHaveBeenCalled();
    // Should navigate to loading screen
    expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.LOADING_DEMO);
    // Should send JOIN_QUEUE packet
    expect(networkServiceSpy.send).toHaveBeenCalledWith(
      LobbyActions.JOIN_QUEUE,
      { username: 'DemoPlayer' }
    );
  }));

  it('should not connect if already connected', fakeAsync(() => {
    Object.defineProperty(networkServiceSpy, 'isConnected', { value: true, writable: true });

    component.startMatchmaking();
    tick();

    // Should not connect again
    expect(networkServiceSpy.connect).not.toHaveBeenCalled();
    // Should still navigate and send packet
    expect(viewStateServiceSpy.navigateToView).toHaveBeenCalledWith(AppView.LOADING_DEMO);
    expect(networkServiceSpy.send).toHaveBeenCalled();
  }));

  it('should handle connection errors gracefully', fakeAsync(() => {
    networkServiceSpy.connect.and.returnValue(Promise.reject(new Error('Connection failed')));

    // Suppress console.error for this test
    spyOn(console, 'error');

    component.startMatchmaking();
    tick();

    expect(console.error).toHaveBeenCalled();
  }));
});
