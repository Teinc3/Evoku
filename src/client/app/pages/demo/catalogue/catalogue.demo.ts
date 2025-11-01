import { Component } from '@angular/core';

import LobbyActions from '@shared/types/enums/actions/system/lobby';
import ViewStateService from '../../../services/view-state.service';
import NetworkService from '../../../services/network.service';
import AppView from '../../../../types/enums/app-view.enum';


@Component({
  selector: 'app-demo-catalogue',
  standalone: true,
  imports: [],
  templateUrl: './catalogue.demo.html',
  styleUrl: './catalogue.demo.scss'
})
export default class CatalogueDemoComponent {
  private static readonly DEFAULT_DEMO_USERNAME = 'DemoPlayer';

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
      // TODO: Replace with actual user profile username when authentication is implemented
      this.networkService.send(LobbyActions.JOIN_QUEUE, {
        username: CatalogueDemoComponent.DEFAULT_DEMO_USERNAME
      });
    } catch (error) {
      console.error('Failed to start matchmaking:', error);
      // Optionally, show an error message to the user
    }
  }
}
