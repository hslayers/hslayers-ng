import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {debounceTime} from 'rxjs';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hs-filter-range-input',
  standalone: true,
  imports: [FormsModule, NgClass],
  template: `
    <div
      class="filter-range-input-container position-relative h-100"
      [ngClass]="{'expanded': expanded()}"
    >
      <div class="value-bubble text-bg-primary" [style.left]="bubblePosition()">
        {{ value() }}
      </div>
      <input
        #rangeInput
        type="range"
        class="form-range border px-1 h-100"
        [(ngModel)]="value"
        [min]="min()"
        [max]="max()"
        (mousedown)="expandRange()"
        (mouseup)="contractRange()"
        (mouseleave)="contractRange()"
      />
    </div>
  `,
  styles: [
    `
      .filter-range-input-container {
        transition: min-width 0.5s ease-in-out;
      }

      .value-bubble {
        position: absolute;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 12px;
        top: -10px;
        transform: translateX(-50%);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterRangeInputComponent {
  min = input<number>();
  max = input<number>();
  value = model<number>();
  change = output<number>();

  bubblePosition = computed(() => {
    const newVal = Number(
      ((this.value() - this.min()) * 100) / (this.max() - this.min()),
    );
    return `calc(${newVal}% + (${12 - newVal * 0.15}px))`;
  });

  private expandedSignal = signal(false);
  expanded = this.expandedSignal.asReadonly();

  constructor() {
    toObservable(this.bubblePosition)
      .pipe(debounceTime(250), takeUntilDestroyed())
      .subscribe(() => {
        this.change.emit(this.value());
      });
  }

  expandRange() {
    this.expandedSignal.set(true);
  }

  contractRange() {
    this.expandedSignal.set(false);
  }
}
