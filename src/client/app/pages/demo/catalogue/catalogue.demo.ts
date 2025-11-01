import { Component } from '@angular/core';

import ViewStateService from '../../../services/view-state.service';
import NetworkService from '../../../services/network.service';
import AppView from '../../../../types/enums/app-view.enum';
import LobbyActions from '@shared/types/enums/actions/system/lobby';


@Component({
  selector: 'app-demo-catalogue',
  standalone: true,
  imports: [],
  templateUrl: './catalogue.demo.html',
  styleUrl: './catalogue.demo.scss'
})
export default class CatalogueDemoComponent {
  protected readonly AppView = AppView;

  constructor(
    protected readonly viewStateService: ViewStateService,
    private readonly networkService: NetworkService
  ) {}

  /**
   * Start matchmaking by connecting to the server and joining the queue
   */
  async startMatchmaking(): Promise<void> {
    try {
      // Connect to the server if not already connected
      if (!this.networkService.isConnected) {
        await this.networkService.connect();
      }

      // Navigate to loading screen
      this.viewStateService.navigateToView(AppView.LOADING_DEMO);

      // Send JOIN_QUEUE packet with username
      // For demo purposes, we'll use a default username
      // In production, this would come from the user's profile
      this.networkService.send(LobbyActions.JOIN_QUEUE, {
        username: 'DemoPlayer'
      });
    } catch (error) {
      console.error('Failed to start matchmaking:', error);
      // Optionally, show an error message to the user
    }
  }
}
