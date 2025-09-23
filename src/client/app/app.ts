/* eslint-disable */
import { Component } from '@angular/core';

import AppView from './types/app-view';
import ViewStateService from './services/view-state.service';
import DynamicFaviconService from './services/dynamic-favicon.service';
import HomePageComponent from './pages/home/home';
import NetworkDemoPageComponent from './pages/demo/network/network.demo';
import BoardDemoPageComponent from './pages/demo/board/board.demo';
/* eslint-enable */


@Component({
  selector: 'app-root',
  imports: [
    HomePageComponent,
    BoardDemoPageComponent,
    NetworkDemoPageComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export default class App {
  protected title = 'Evoku';
  protected readonly AppView = AppView;

  constructor(
    protected readonly faviconService: DynamicFaviconService,
    protected readonly viewStateService: ViewStateService
  ) {}
}
