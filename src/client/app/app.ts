// eslint-disable-next-line import/newline-after-import
import { RouterOutlet } from '@angular/router';
// eslint-disable-next-line import/newline-after-import
import { Component, type OnInit } from '@angular/core';

// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import DynamicFaviconService from './services/dynamic-favicon.service';
import NetworkStatusComponent from './components/network-status.component';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NetworkStatusComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export default class App implements OnInit {
  protected title = 'Evoku';

  constructor(private readonly favicons: DynamicFaviconService) {}

  ngOnInit(): void {
    this.favicons.start();
  }
}
