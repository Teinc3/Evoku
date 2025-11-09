import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-universal-progress-bar',
  standalone: true,
  imports: [],
  templateUrl: './universal-progress-bar.component.html',
  styleUrl: './universal-progress-bar.component.scss'
})
export default class UniversalProgressBarComponent {
  @Input() percentage: number = 0;
  @Input() isVertical: boolean = false;
  @Input() flipDirection: boolean = false;
}
