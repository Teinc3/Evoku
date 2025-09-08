import { bootstrapApplication } from '@angular/platform-browser';

import appConfig from './app/app.config';
import App from './app/app';
import PacketRegistry from '@shared/networking/registry';


// Initialize packet auto-loading before starting the application
PacketRegistry.ensurePacketsLoaded().then(() => {
  bootstrapApplication(App, appConfig)
    .catch(err => console.error(err));
}).catch(err => {
  console.warn('Failed to pre-load packets, continuing with normal startup:', err);
  bootstrapApplication(App, appConfig)
    .catch(err => console.error(err));
});
