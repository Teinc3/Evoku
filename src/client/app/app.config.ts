import { provideRouter } from '@angular/router';
import {
  provideBrowserGlobalErrorListeners, provideZoneChangeDetection,
  type ApplicationConfig
} from '@angular/core';

import { APP_CONFIG, AppConfig } from './config';
import routes from './app.routes';


export default {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: APP_CONFIG, useValue: AppConfig }
  ]
} as ApplicationConfig;
