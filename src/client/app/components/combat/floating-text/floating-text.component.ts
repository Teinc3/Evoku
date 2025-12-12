import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';


export interface FloatingTextData {
  text: string;
  type: 'reflected' | 'hit';
}

@Component({
  selector: 'app-floating-text',
  standalone: true,
  imports: [NgIf],
  templateUrl: './floating-text.component.html',
  styleUrl: './floating-text.component.scss'
})
export default class FloatingTextComponent implements OnInit {
  static readonly ANIMATION_DURATION_MS = 2000;

  @Input() data: FloatingTextData | null = null;
  @Output() animationComplete = new EventEmitter<void>();

  ngOnInit(): void {
    if (this.data) {
      setTimeout(() => {
        this.animationComplete.emit();
      }, FloatingTextComponent.ANIMATION_DURATION_MS);
    }
  }
}
