import { Component } from '@angular/core';

import NetworkStatusComponent from '../../../components/network-status.component';


@Component({
  selector: 'app-network-demo-page',
  standalone: true,
  imports: [NetworkStatusComponent],
  templateUrl: './network.demo.html',
  styleUrl: './network.demo.scss'
})
export default class NetworkDemoPageComponent {}
