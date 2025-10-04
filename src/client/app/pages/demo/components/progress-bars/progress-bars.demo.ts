import { Component } from '@angular/core';

import AppView from '../../../../types/app-view';
import ViewStateService from '../../../../services/view-state.service';


@Component({
  selector: 'app-demo-progressbars',
  standalone: true,
  imports: [],
  templateUrl: './progress-bars.demo.html',
  styleUrl: './progress-bars.demo.scss'
})
export default class ProgressbarsDemoPageComponent {
  protected readonly AppView = AppView;

  constructor(protected readonly viewStateService: ViewStateService) {}
}