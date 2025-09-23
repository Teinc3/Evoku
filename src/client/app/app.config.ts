import {
  provideBrowserGlobalErrorListeners, provideZoneChangeDetection,
  type ApplicationConfig
} from '@angular/core';

import NetworkService from './services/network.service';
import { APP_CONFIG, AppConfig } from './config';


export default {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    { provide: APP_CONFIG, useValue: AppConfig },
    NetworkService
  ]
} as ApplicationConfig;
