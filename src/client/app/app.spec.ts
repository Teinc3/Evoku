import { TestBed } from '@angular/core/testing';

import WebSocketService from '../networking/services/WebSocketService';
import NetworkService from './services/network.service';
import { APP_CONFIG, AppConfig } from './config';
import App from './app';


describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: APP_CONFIG, useValue: AppConfig },
        { provide: WebSocketService, useFactory: () => new WebSocketService() },
        NetworkService
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
