/* eslint-disable */
import { Component } from '@angular/core';

import AppView from '../../../types/app-view';
import ViewStateService from '../../../services/view-state.service';
/* eslint-enable */

@Component({
  selector: 'app-demo-catalogue',
  standalone: true,
  imports: [],
  templateUrl: './catalogue.demo.html',
  styleUrl: './catalogue.demo.scss'
})
export default class CatalogueDemoComponent {
  protected readonly AppView = AppView;
  constructor(protected readonly viewStateService: ViewStateService) {}
}