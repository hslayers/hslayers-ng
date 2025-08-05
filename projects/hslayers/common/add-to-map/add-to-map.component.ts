import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'hs-add-to-map',
  template: `
    <button
      class="btn btn-primary w-100"
      [disabled]="disabled"
      [title]="title | translate"
      (click)="addLayer()"
      [ngClass]="classes"
    >
      @if (!loading) {
        <span class="d-flex justify-content-center align-items-baseline gap-1">
          <i class="fa-solid fa-plus"> </i>{{ 'COMMON.addToMap' | translate }}
        </span>
      } @else {
        <span>
          <span class="hs-loader"></span>&emsp;
          {{ 'COMMON.uploading' | translate }}
        </span>
      }
      <ng-content></ng-content>
    </button>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  imports: [CommonModule, TranslatePipe],
})
export class HsAddToMapButtonComponent {
  @Input() disabled: boolean;
  /**
   * Translation string to be used as title
   */
  @Input() title: string = 'COMMON.addToMap';
  @Input() loading: boolean = false;
  @Input() classes: string;

  @Output() add = new EventEmitter<void>();

  constructor() {}

  /**
   * Emit add event to trigger bind action
   */
  addLayer() {
    this.add.emit();
  }
}
