import VisionPageComponent from './pages/vision/vision';
import NotFoundPageComponent from './pages/not-found/not-found';
import HomePageComponent from './pages/home/home';
import DemoPageComponent from './pages/demo/demo';

import type { Routes } from '@angular/router';


export default [
  { path: '', component: HomePageComponent },
  { path: 'demo', component: DemoPageComponent },
  { path: 'vision', component: VisionPageComponent },
  { path: '**', component: NotFoundPageComponent } // Show 404 page for unknown routes
] as Routes;
