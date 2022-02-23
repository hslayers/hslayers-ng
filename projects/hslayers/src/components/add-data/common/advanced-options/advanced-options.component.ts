import {Component, Input} from '@angular/core';

import {HsAddDataVectorService} from '../../vector/vector.service';

@Component({
  selector: 'hs-advanced-options',
  templateUrl: 'advanced-options.component.html',
})
export class HsAdvancedOptionsComponent {
  @Input() data: any;
  @Input() app = 'default';

  constructor(public hsAddDataVectorService: HsAddDataVectorService) {}
}
