import {Component, input, output} from '@angular/core';

@Component({
  selector: 'hs-add-as-toggle',
  standalone: false,
  template: `
    <div
      class="d-flex flex-row justify-content-start align-items-center my-2 rounded border"
    >
      <span
        class="control-label input-group-text border-top-0 border-bottom-0 border-start-0"
      >
        {{ 'COMMON.addAs' | translate }}
      </span>
      <div
        class="d-flex flex-fill gap-2 justify-content-end align-items-center"
      >
        <!-- Base/Layer Toggle -->
        <div class="btn-group">
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            (click)="setBase(true)"
            [ngClass]="{active: isBase()}"
          >
            {{ 'COMPOSITONKEYWORDS.Basemap' | translate }}
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            (click)="setBase(false)"
            [ngClass]="{active: !isBase()}"
          >
            {{ 'COMMON.layer' | translate }}
          </button>
        </div>

        <!-- Group/Separate Toggle (WMS only) -->
        @if (showGroupToggle()) {
          <div class="btn-group">
            <button
              type="button"
              class="text-capitalize btn btn-sm btn-outline-secondary"
              (click)="setGroup(true)"
              [ngClass]="{active: isGroup()}"
            >
              {{ 'COMMON.group' | translate }}
            </button>
            <button
              type="button"
              class="text-capitalize btn btn-sm btn-outline-secondary"
              (click)="setGroup(false)"
              [ngClass]="{active: !isGroup()}"
              [disabled]="isBase() === true"
            >
              {{ 'COMMON.separateLayers' | translate }}
            </button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HsAddUrlAsToggleComponent {
  isBase = input<boolean>(false);
  isGroup = input<boolean>(false);
  showGroupToggle = input<boolean>(false);

  baseChange = output<boolean>();
  groupChange = output<boolean>();

  setBase(state: boolean) {
    this.baseChange.emit(state);
  }

  setGroup(state: boolean) {
    this.groupChange.emit(state);
  }
}
