import { InjectionToken } from '@angular/core';

import deepFreeze from '../../../shared/utils/deepFreeze';
import configData from '../../../../config/client.json' with { type: 'json' };


export const AppConfig = deepFreeze(configData);
export type AppConfigType = typeof AppConfig;
export const APP_CONFIG = new InjectionToken<AppConfigType>('app.config');
