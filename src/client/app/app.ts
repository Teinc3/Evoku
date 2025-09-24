/* eslint-disable */
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import DynamicFaviconService from './services/dynamic-favicon.service';
/* eslint-enable */


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet></router-outlet>',
  styleUrl: './app.scss'
})
export default class App {
  constructor(
    protected readonly faviconService: DynamicFaviconService
  ) {}
}
