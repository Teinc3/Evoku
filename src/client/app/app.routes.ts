import VisionPageComponent from './pages/vision/vision';
import HomePageComponent from './pages/home/home';
import DemoPageComponent from './pages/demo/demo';

import type { Routes } from '@angular/router';


export default [
  { path: '', component: HomePageComponent },
  { path: 'demo', component: DemoPageComponent },
  { path: 'vision', component: VisionPageComponent }
] as Routes;
