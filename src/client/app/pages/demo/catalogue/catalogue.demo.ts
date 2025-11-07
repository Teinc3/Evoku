import { Component } from '@angular/core';

import ViewStateService from '../../../services/view-state';
import { AppView } from '../../../../types/enums';


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