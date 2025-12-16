import { Component } from '@angular/core';

import ViewStateService from '../../services/view-state';
import { AppView } from '../../../types/enums';
import NetworkDemoPageComponent from './misc/network/network.demo';
import LoadingDemoPageComponent from './loading/loading.demo';
import TimeAttackDemoPageComponent from './gameplay/time-attack/time-attack.demo';
import DuelDemoPageComponent from './gameplay/duel/duel.demo';
import ProgressbarsDemoPageComponent from './components/progress-bars/progress-bars.demo';
import BoardDemoPageComponent from './components/board/board.demo';
import CatalogueDemoComponent from './catalogue/catalogue.demo';


@Component({
  selector: 'app-demo-page',
  standalone: true,
  imports: [
    BoardDemoPageComponent, 
    NetworkDemoPageComponent, 
    TimeAttackDemoPageComponent, 
    CatalogueDemoComponent,
    DuelDemoPageComponent,
    ProgressbarsDemoPageComponent,
    LoadingDemoPageComponent
  ],
  templateUrl: './demo.html',
  styleUrl: './demo.scss'
})
export default class DemoPageComponent {
  protected readonly AppView = AppView;
  constructor(
    protected readonly viewStateService: ViewStateService,
  ) {}
}
