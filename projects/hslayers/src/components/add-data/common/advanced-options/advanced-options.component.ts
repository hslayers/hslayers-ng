import {Component, Input, OnInit} from '@angular/core';

import {HsAddDataVectorService} from '../../vector/vector.service';

@Component({
  selector: 'hs-advanced-options',
  templateUrl: 'advanced-options.component.html',
})
export class HsAdvancedOptionsComponent implements OnInit {
  @Input() data: any;
  @Input() app = 'default';
  isKml: boolean;
  constructor(private hsAddDataVectorService: HsAddDataVectorService) {}
  ngOnInit(): void {
    this.isKml = this.hsAddDataVectorService.isKml(
      this.data.type,
      this.data.url
    );
  }
}
