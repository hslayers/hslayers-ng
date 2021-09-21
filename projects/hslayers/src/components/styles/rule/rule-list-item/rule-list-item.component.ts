import {Component, Input} from '@angular/core';

import {HsStylerService} from '../../styler.service';

@Component({
  selector: 'hs-rule-list-item',
  templateUrl: 'rule-list-item.component.html',
  styleUrls: ['../../styler.component.scss'],
})
export class HsRuleListItemComponent {
  @Input() rule: any;
  ruleVisible = false;
  constructor(public hsStylerService: HsStylerService) {}
}
