import { Component } from '@angular/core';

import AppView from '../../../../types/app-view.enum';
import ViewStateService from '../../../../services/view-state.service';
import DuelHudTopComponent from '../../../../components/hud/duel-hud-top/duel-hud-top';
import BoardModelComponent from '../../../../components/board/board.component';


@Component({
  selector: 'app-demo-duel',
  standalone: true,
  imports: [DuelHudTopComponent, BoardModelComponent],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent {
  protected readonly AppView = AppView;

  constructor(protected readonly viewStateService: ViewStateService) {}
}
