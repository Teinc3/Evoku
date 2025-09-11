import { provideRouter } from '@angular/router';
import {
  provideBrowserGlobalErrorListeners, provideZoneChangeDetection,
  type ApplicationConfig
} from '@angular/core';

import NetworkService from './services/network.service';
import { APP_CONFIG, AppConfig } from './config';
import routes from './app.routes';


export default {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: APP_CONFIG, useValue: AppConfig },
    NetworkService
  ]
} as ApplicationConfig;
