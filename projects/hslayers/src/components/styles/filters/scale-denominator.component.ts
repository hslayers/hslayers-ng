import {Component, Input, OnInit} from '@angular/core';

import {Rule} from 'geostyler-style';

import {HsStylerPartBaseComponent} from '../style-part-base.component';

@Component({
  selector: 'hs-scale-denominator',
  templateUrl: './scale-denominator.html',
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
      return;
    }
    if (this.rule.scaleDenominator == undefined) {
      this.rule.scaleDenominator = {};
    }
    Object.assign(this.rule.scaleDenominator, this.scaleDenominator);
    super.emitChange();
  }
}
