import { bootstrapApplication } from '@angular/platform-browser';

import appConfig from './app/app.config';
import App from './app/app';
import PacketRegistry from '../shared/networking/registry';


// Initialize packet registry early for client-side usage
PacketRegistry.initialize().catch(console.warn);

bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));
