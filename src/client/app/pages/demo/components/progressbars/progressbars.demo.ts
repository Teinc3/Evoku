import { Component } from '@angular/core';

import AppView from '../../../../types/app-view';
import ViewStateService from '../../../../services/view-state.service';


@Component({
  selector: 'app-demo-progressbars',
  standalone: true,
  imports: [],
  templateUrl: './progressbars.demo.html',
  styleUrl: './progressbars.demo.scss'
})
export default class ProgressbarsDemoPageComponent {
  protected readonly AppView = AppView;

  constructor(protected readonly viewStateService: ViewStateService) {}
}