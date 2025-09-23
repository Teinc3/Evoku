/* eslint-disable */
import { Component } from '@angular/core';

import AppView from '../../types/app-view';
import ViewStateService from '../../services/view-state.service';
/* eslint-enable */


@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export default class HomePageComponent {
  constructor(private readonly viewStateService: ViewStateService) {}

  navigateToBoardDemo(): void {
    this.viewStateService.navigateToView(AppView.BOARD_DEMO);
  }

  navigateToNetworkDemo(): void {
    this.viewStateService.navigateToView(AppView.NETWORK_DEMO);
  }
}