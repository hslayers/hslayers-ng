import {Component, Input, OnInit} from '@angular/core';

import {Rule} from 'geostyler-style';

import {HsStylerPartBaseComponent} from 'hslayers-ng/services/styler';

@Component({
  selector: 'hs-scale-denominator',
  templateUrl: './scale-denominator.component.html',
})
export class HsScaleDenominatorComponent
  extends HsStylerPartBaseComponent
  implements OnInit
{
  @Input() rule: Rule;

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
      super.emitChange();
      return;
    }

    if (this.rule.scaleDenominator == undefined) {
      this.rule.scaleDenominator = {};
    }
    Object.assign(this.rule.scaleDenominator, this.scaleDenominator);
    //After assign to keep max input empty -> prevent 'out of range' warning
    if (
      this.rule.scaleDenominator.max === null &&
      this.rule.scaleDenominator.min !== null
    ) {
      this.rule.scaleDenominator.max = Infinity;
    }
    super.emitChange();
  }
}
