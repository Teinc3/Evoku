import { RouterOutlet } from '@angular/router';
import { Component } from '@angular/core';

import NetworkStatusComponent from './network-status.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NetworkStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export default class App {
  protected title = 'Evoku';
}
