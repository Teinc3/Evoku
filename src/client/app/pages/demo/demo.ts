/* eslint-disable */
import { Component } from '@angular/core';

import AppView from '../../types/app-view';
import ViewStateService from '../../services/view-state.service';
import TimeAttackDemoPageComponent from './time-attack/time-attack.demo';
import NetworkDemoPageComponent from './network/network.demo';
import BoardDemoPageComponent from './board/board.demo';
/* eslint-enable */


@Component({
  selector: 'app-demo-page',
  standalone: true,
  imports: [BoardDemoPageComponent, NetworkDemoPageComponent, TimeAttackDemoPageComponent],
  templateUrl: './demo.html',
  styleUrl: './demo.scss'
})
export default class DemoPageComponent {
  protected readonly AppView = AppView;
  constructor(protected readonly viewStateService: ViewStateService) {}
}
