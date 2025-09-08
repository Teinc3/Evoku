import { TestBed } from '@angular/core/testing';

import { APP_CONFIG, AppConfig } from './config';
import App from './app';


describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: APP_CONFIG, useValue: AppConfig },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
