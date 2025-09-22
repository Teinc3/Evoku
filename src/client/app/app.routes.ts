import HomePageComponent from './pages/home/home';
import TimeAttackDemoPageComponent from './pages/demo/time-attack/time-attack.demo';
import NetworkDemoPageComponent from './pages/demo/network/network.demo';
import BoardDemoPageComponent from './pages/demo/board/board.demo';

import type { Routes } from '@angular/router';


export default [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  { path: 'demo/board', component: BoardDemoPageComponent },
  { path: 'demo/network', component: NetworkDemoPageComponent },
  { path: 'demo/time-attack', component: TimeAttackDemoPageComponent },
] as Routes;
