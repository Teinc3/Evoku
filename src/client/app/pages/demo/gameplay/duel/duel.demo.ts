import { Component } from '@angular/core';

import AppView from '../../../../types/app-view.enum';
import ViewStateService from '../../../../services/view-state.service';


@Component({
  selector: 'app-demo-duel',
  standalone: true,
  imports: [],
  templateUrl: './duel.demo.html',
  styleUrl: './duel.demo.scss'
})
export default class DuelDemoPageComponent {
  protected readonly AppView = AppView;

  constructor(protected readonly viewStateService: ViewStateService) {}
}
