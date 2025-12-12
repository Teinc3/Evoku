import { Component, Input, OnInit } from '@angular/core';
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
  @Input() data: FloatingTextData | null = null;
  visible = false;

  ngOnInit(): void {
    if (this.data) {
      this.visible = true;
      setTimeout(() => {
        this.visible = false;
      }, 2000);
    }
  }
}
