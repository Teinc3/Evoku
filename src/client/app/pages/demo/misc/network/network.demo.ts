import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import SessionActions from '@shared/types/enums/actions/system/session';
import NetworkService from '../../../../services/network.service';

import type { OnInit } from '@angular/core';


@Component({
  selector: 'app-demo-network',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './network.demo.html',
  styleUrl: './network.demo.scss'
})
export default class NetworkDemoPageComponent implements OnInit {
  public networkService = inject(NetworkService);

  isConnected = false;
  logs: Array<{ timestamp: Date; message: string; type: string }> = [];

  ngOnInit() {
    this.updateConnectionStatus();
    this.addLog('Component initialized', 'info');
    this.setupDisconnectHandler();
  }

  private updateConnectionStatus() {
    this.isConnected = this.networkService.isConnected;
  }

  async connect() {
    this.addLog('Connection attempt initiated', 'info');
    try {
      await this.networkService.connect();
      this.updateConnectionStatus();
      this.addLog('Successfully connected', 'success');
    } catch (error) {
      this.updateConnectionStatus();
      let msg: string;
      if (error instanceof ErrorEvent) {
        msg = JSON.stringify({
          type: error.type, 
          message: error.message, 
          filename: error.filename, 
          lineno: error.lineno 
        });
      } else if (error instanceof Event) {
        msg = JSON.stringify({ 
          type: error.type, 
          target: (error.target as unknown as { url: string })?.url || 'unknown' 
        });
      } else if (error instanceof Error) {
        msg = error.message;
      } else {
        msg = String(error);
      }
      this.addLog(`Connection failed: ${msg}`, 'error');
    }
  }

  disconnect() {
    try {
      this.networkService.disconnect();
      this.addLog('Disconnected from server', 'warning');
      this.updateConnectionStatus();
    } catch (error) {
      this.addLog(`Disconnect error: ${error}`, 'error');
    }
  }

  sendTestPacket() {
    try {
      // Send a ping packet as a test
      this.networkService.send(SessionActions.HEARTBEAT, {});
      this.addLog('Test heartbeat sent', 'success');
    } catch (error) {
      this.addLog(`Failed to send test packet: ${error}`, 'error');
    }
  }

  private setupDisconnectHandler() {
    // Set up disconnect callback to handle socket disconnections
    this.networkService.getWSService().setDisconnectCallback(() => {
      this.handleDisconnect();
    });
  }

  private handleDisconnect() {
    // Update connection status
    this.isConnected = false;

    // Add log entry for disconnect
    this.addLog('Socket disconnected from server', 'error');

    // Force UI update
    this.updateConnectionStatus();
  }

  private addLog(message: string, type: string = 'info') {
    this.logs.unshift({
      timestamp: new Date(),
      message,
      type
    });

    // Keep only the last 20 logs
    if (this.logs.length > 20) {
      this.logs = this.logs.slice(0, 20);
    }
  }
}
