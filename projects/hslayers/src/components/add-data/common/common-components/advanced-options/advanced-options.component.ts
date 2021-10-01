import {Component, Input} from '@angular/core';

import {HsAddDataVectorService} from '../../../vector/add-data-vector.service';

@Component({
  selector: 'hs-advanced-options',
  templateUrl: 'advanced-options.component.html',
})
export class HsAdvancedOptionsComponent {
  @Input() data: any;

  constructor(public hsAddDataVectorService: HsAddDataVectorService) {}
}
