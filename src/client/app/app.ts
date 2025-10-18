import { RouterOutlet } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import NetworkService from './services/network.service';
import DynamicFaviconService from './services/dynamic-favicon.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export default class App implements OnInit {
  constructor(
    protected readonly faviconService: DynamicFaviconService,
    private readonly networkService: NetworkService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.networkService.initGuestAuth();
    } catch (error) {
      console.error('Failed to initialize guest authentication:', error);
    }
  }
}
