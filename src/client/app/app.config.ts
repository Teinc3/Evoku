import { provideRouter } from '@angular/router';
import { provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';

import routes from './app.routes';

import type { ApplicationConfig } from '@angular/core';


export default {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes)
  ]
} as ApplicationConfig;
