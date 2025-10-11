import { provideRouter } from '@angular/router';
import { 
  provideBrowserGlobalErrorListeners, provideZoneChangeDetection, 
  type ApplicationConfig
} from '@angular/core';

import NetworkService from './services/network.service';
import routes from './app.routes';


export default {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    NetworkService
  ]
} as ApplicationConfig;
