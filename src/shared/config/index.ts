import base from '@config/shared/base.json' with { type: 'json' };
import { deepFreeze, deepMerge, type JsonObject } from '../utils/config';
import chosenOverride from './env-override';

import type SharedConfigType from './schema';


const merged = deepMerge(base as JsonObject, chosenOverride as JsonObject) as SharedConfigType;
const sharedConfig = deepFreeze(merged);

export default sharedConfig;
