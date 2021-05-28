import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {Rule} from 'geostyler-style';

@Component({
  selector: 'hs-scale-denominator',
  templateUrl: './scale-denominator.html',
})
export class HsScaleDenominatorComponent implements OnInit {
  @Input() rule: Rule;
  @Output() changes = new EventEmitter<void>();

  scaleDenominator: {min: number; max: number} = {min: null, max: null};

  ngOnInit(): void {
    Object.assign(this.scaleDenominator, this.rule.scaleDenominator);
  }

  emitChange(): void {
    if (
      this.scaleDenominator.min === null &&
      this.scaleDenominator.max === null
    ) {
      delete this.rule.scaleDenominator;
      return;
    }
    if (this.rule.scaleDenominator == undefined) {
      this.rule.scaleDenominator = {};
    }
    Object.assign(this.rule.scaleDenominator, this.scaleDenominator);
    this.changes.emit();
  }
}
