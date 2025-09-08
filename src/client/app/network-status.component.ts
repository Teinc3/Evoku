import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import SessionActions from '@shared/types/enums/actions/system/session';
import NetworkService from './services/network.service';

import type { OnInit } from '@angular/core';


@Component({
  selector: 'app-network-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="network-status">
      <h2>Network Status</h2>
      <div class="status-indicator">
        <span
          class="status-dot"
          [class.connected]="isConnected"
          [class.disconnected]="!isConnected"
        ></span>
        <span class="status-text">{{ isConnected ? 'Connected' : 'Disconnected' }}</span>
      </div>

      <div class="connection-info" *ngIf="this.networkService.latency">
        <p><strong>Latency:</strong> {{ this.networkService.latency }}</p>
      </div>

      <div class="actions">
        <button
          class="btn btn-primary"
          (click)="connect()"
          [disabled]="isConnected"
        >
          Connect
        </button>
        <button
          class="btn btn-secondary"
          (click)="disconnect()"
          [disabled]="!isConnected"
        >
          Disconnect
        </button>
        <button
          class="btn btn-test"
          (click)="sendTestPacket()"
          [disabled]="!isConnected"
        >
          Send Test Packet
        </button>
      </div>

      <div class="logs" *ngIf="logs.length > 0">
        <h3>Activity Log</h3>
        <div class="log-entries">
          <div *ngFor="let log of logs" class="log-entry" [class]="log.type">
            <span class="timestamp">{{ log.timestamp | date:'HH:mm:ss' }}</span>
            <span class="message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .network-status {
      max-width: 600px;
      margin: 2rem auto;
      padding: 2rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .status-dot.connected {
      background-color: #28a745;
    }

    .status-dot.disconnected {
      background-color: #dc3545;
    }

    .status-text {
      font-weight: bold;
    }

    .connection-info {
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: white;
      border-radius: 4px;
    }

    .connection-info p {
      margin: 0.25rem 0;
    }

    .actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background-color 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: #545b62;
    }

    .btn-test {
      background-color: #17a2b8;
      color: white;
    }

    .btn-test:hover:not(:disabled) {
      background-color: #138496;
    }

    .logs {
      margin-top: 2rem;
    }

    .logs h3 {
      margin-bottom: 1rem;
    }

    .log-entries {
      max-height: 200px;
      overflow-y: auto;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0.5rem;
    }

    .log-entry {
      padding: 0.25rem 0;
      border-bottom: 1px solid #eee;
    }

    .log-entry:last-child {
      border-bottom: none;
    }

    .log-entry.info {
      color: #007bff;
    }

    .log-entry.success {
      color: #28a745;
    }

    .log-entry.error {
      color: #dc3545;
    }

    .log-entry.warning {
      color: #ffc107;
    }

    .timestamp {
      font-size: 0.875rem;
      color: #666;
      margin-right: 0.5rem;
    }
  `]
})
export default class NetworkStatusComponent implements OnInit {
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

  connect() {
    try {
      this.networkService.connect();
      this.addLog('Connection attempt initiated', 'info');
      // Update status after a short delay to allow connection to establish
      setTimeout(() => {
        this.updateConnectionStatus();
        this.addLog(
          this.isConnected ? 'Successfully connected' : 'Connection failed',
          this.isConnected ? 'success' : 'error'
        );
      }, 1000);
    } catch (error) {
      this.addLog(`Connection error: ${error}`, 'error');
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
    this.networkService.getNetworkService().setDisconnectCallback(() => {
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
