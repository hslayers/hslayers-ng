import {Component, EventEmitter, Input, Output} from '@angular/core';
import {HsStylerColorService} from './styler-color.service';

@Component({
  selector: 'hs-styler-color-component',
  templateUrl: './partials/color.html',
})
export class HsStylerColorComponent {
  @Input() color: any;
  @Output() colorChange = new EventEmitter<any>();

  constructor(public HsStylerColorService: HsStylerColorService) {}

  colorSelected(col): void {
    this.color = col;
    this.colorChange.emit(this.color);
  }
}
