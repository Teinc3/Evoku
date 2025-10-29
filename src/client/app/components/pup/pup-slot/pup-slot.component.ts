import { Component, type OnInit } from '@angular/core';

import pupConfig from '@config/shared/pup.json';


@Component({
  selector: 'app-pup-slot',
  standalone: true,
  templateUrl: './pup-slot.component.html',
  styleUrl: './pup-slot.component.scss'
})
export default class PupSlotComponent implements OnInit {
  // TODO: Accept a PUPClass input instead in the future

  protected pupIcon: string | null = null;
  protected level: number | null = null;

  ngOnInit(): void {
    // 70% chance to load a random pup
    if (Math.random() < 0.7 && pupConfig.length > 0) {
      const randomPup = pupConfig[Math.floor(Math.random() * pupConfig.length)];
      this.pupIcon = randomPup.asset.icon;
      
      // Set random level between 1-5 if there's a pup
      this.level = Math.floor(Math.random() * 5) + 1;
    }
  }
}
