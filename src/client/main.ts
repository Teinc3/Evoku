import { bootstrapApplication } from '@angular/platform-browser';

import "@shared/networking/packets";
import appConfig from './app/app.config';
import App from './app/app';


bootstrapApplication(App, appConfig)
  .catch(err => console.error(err));
