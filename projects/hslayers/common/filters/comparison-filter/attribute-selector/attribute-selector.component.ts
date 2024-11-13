import {Component, forwardRef, input} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

@Component({
  selector: 'hs-filters-attribute-selector',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, TranslateCustomPipe],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      // eslint-disable-next-line no-use-before-define
      useExisting: forwardRef(() => HsAttributeSelectorComponent),
      multi: true,
    },
  ],
  template: `
    <select
      class="form-control form-select hs-comparison-filter-attribute h-100 border-end-0"
      [(ngModel)]="value"
      (ngModelChange)="onChange($event)"
      (blur)="onTouched()"
      [disabled]="disabled"
    >
      <option [ngValue]="null" [disabled]="true" hidden>
        {{ 'FILTERS.pickAnAttribute' | translateHs }}
      </option>
      @for (attr of attributes(); track attr) {
        <option [ngValue]="attr">{{ attr }}</option>
      }
    </select>
  `,
})
export class HsAttributeSelectorComponent implements ControlValueAccessor {
  attributes = input.required<string[]>();

  value: string = null;
  disabled = false;

  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
