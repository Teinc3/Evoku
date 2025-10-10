import { Component } from '@angular/core';

import AppView from '../../../../types/app-view.enum';
import ViewStateService from '../../../../services/view-state.service';
import UniversalProgressBarComponent
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';


@Component({
  selector: 'app-demo-progressbars',
  standalone: true,
  imports: [UniversalProgressBarComponent],
  templateUrl: './progress-bars.demo.html',
  styleUrl: './progress-bars.demo.scss'
})
export default class ProgressbarsDemoPageComponent {
  protected readonly AppView = AppView;

  constructor(protected readonly viewStateService: ViewStateService) {}
}