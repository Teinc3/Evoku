import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';

import DynamicFaviconService from './services/dynamic-favicon.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export default class App {
  constructor(
    protected readonly faviconService: DynamicFaviconService
  ) {}
}
