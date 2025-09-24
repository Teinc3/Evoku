/* eslint-disable */
import { Component } from '@angular/core';

import AppView from '../../types/app-view';
import ViewStateService from '../../services/view-state.service';
import BoardDemoPageComponent from './board/board.demo';
import NetworkDemoPageComponent from './network/network.demo';
/* eslint-enable */


@Component({
  selector: 'app-demo-page',
  standalone: true,
  imports: [BoardDemoPageComponent, NetworkDemoPageComponent],
  templateUrl: './demo.html',
  styleUrl: './demo.scss'
})
export default class DemoPageComponent {
  protected readonly AppView = AppView;
  constructor(protected readonly viewStateService: ViewStateService) {}
}
