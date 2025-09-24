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
  protected readonly AppView = AppView;
  constructor(protected readonly viewStateService: ViewStateService) {}
}
