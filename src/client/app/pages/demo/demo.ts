import { Component, OnInit, OnDestroy } from '@angular/core';

import ViewStateService from '../../services/view-state.service';
import AppView from '../../../types/enums/app-view.enum';
import NetworkDemoPageComponent from './misc/network/network.demo';
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
    ProgressbarsDemoPageComponent
  ],
  templateUrl: './demo.html',
  styleUrl: './demo.scss'
})
export default class DemoPageComponent implements OnInit, OnDestroy {
  protected readonly AppView = AppView;
  constructor(protected readonly viewStateService: ViewStateService) {}

  ngOnInit(): void {
    document.body.classList.add('no-bg');
  }

  ngOnDestroy(): void {
    document.body.classList.remove('no-bg');
  }
}
