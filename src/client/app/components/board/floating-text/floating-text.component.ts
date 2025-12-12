import { Component, Input } from '@angular/core';

import type { FloatingTextMessage } from '../../../../types/combat';


@Component({
  selector: 'app-floating-text',
  standalone: true,
  templateUrl: './floating-text.component.html',
  styleUrl: './floating-text.component.scss'
})
export default class FloatingTextComponent {
  @Input()
  messages: FloatingTextMessage[] = [];

  protected leftPercent(msg: FloatingTextMessage): string {
    if (msg.cellIndex === undefined) {
      return '50%';
    }
    const col = msg.cellIndex % 9;
    const pct = ((col + 0.5) / 9) * 100;
    return `${pct}%`;
  }

  protected topPercent(msg: FloatingTextMessage): string {
    if (msg.cellIndex === undefined) {
      return '50%';
    }
    const row = Math.floor(msg.cellIndex / 9);
    const pct = ((row + 0.5) / 9) * 100;
    return `${pct}%`;
  }
}
