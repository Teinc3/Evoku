import { Component } from '@angular/core';

import AppView from '../../types/app-view';
import ViewStateService from '../../services/view-state.service';
import NetworkDemoPageComponent from './misc/network/network.demo';
import TimeAttackDemoPageComponent from './gameplay/time-attack/time-attack.demo';
import DuelDemoPageComponent from './gameplay/duel/duel.demo';
import ProgressbarsDemoPageComponent from './components/progressbars/progressbars.demo';
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
    ProgressbarsDemoPageComponent
  ],
  templateUrl: './demo.html',
  styleUrl: './demo.scss'
})
export default class DemoPageComponent {
  protected readonly AppView = AppView;
  constructor(protected readonly viewStateService: ViewStateService) {}
}
