import {CommonModule} from '@angular/common';
import {Component, EventEmitter, Input, Output} from '@angular/core';

import {HsLanguageModule} from '../../components/language/language.module';
import {TranslateCustomPipe} from '../../components/language/translate-custom.pipe';

@Component({
  selector: 'hs-add-to-map',
  standalone: true,
  template: `
    <button
      class="btn btn-primary w-100"
      [disabled]="disabled"
      [title]="title | translateHs"
      (click)="addLayer()"
      [ngClass]="classes"
    >
      <span
        *ngIf="!loading; else loader"
        class="d-flex justify-content-center align-items-baseline gap-1"
      >
        <i class="icon-plus"> </i>{{ 'COMMON.addToMap' | translateHs }}
      </span>
      <ng-template #loader>
        <span>
          <span class="hs-loader"></span>&emsp;
          {{ 'COMMON.uploading' | translateHs }}
        </span>
      </ng-template>
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
  imports: [CommonModule, HsLanguageModule, TranslateCustomPipe],
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
