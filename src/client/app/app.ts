import { Component } from '@angular/core';
import { NgSwitch, NgSwitchCase } from '@angular/common';

import AppView from './types/app-view';
import HomePageComponent from './pages/home/home';
import NetworkDemoPageComponent from './pages/demo/network/network.demo';
import BoardDemoPageComponent from './pages/demo/board/board.demo';

import ViewStateService from './services/view-state.service';
import DynamicFaviconService from './services/dynamic-favicon.service';

 
 


@Component({
  selector: 'app-root',
  imports: [
    NgSwitch,
    NgSwitchCase,
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
    private readonly _faviconService: DynamicFaviconService,
    protected readonly viewStateService: ViewStateService
  ) {}
}
