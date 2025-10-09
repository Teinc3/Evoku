import { Component } from '@angular/core';

import AppView from '../../../../types/app-view.enum';
import ViewStateService from '../../../../services/view-state.service';
import UniversalProgressBarComponent
  from '../../../../components/hud/universal-progress-bar/universal-progress-bar.component';
import PhaseTimerComponent from '../../../../components/hud/phase-timer/phase-timer.component';


@Component({
  selector: 'app-demo-progressbars',
  standalone: true,
  imports: [UniversalProgressBarComponent, PhaseTimerComponent],
  templateUrl: './progress-bars.demo.html',
  styleUrl: './progress-bars.demo.scss'
})
export default class ProgressbarsDemoPageComponent {
  protected readonly AppView = AppView;

  constructor(protected readonly viewStateService: ViewStateService) {}
}