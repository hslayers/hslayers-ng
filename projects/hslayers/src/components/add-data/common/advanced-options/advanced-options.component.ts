import {Component, Input, OnInit} from '@angular/core';

import {FileDataObject} from '../../file/types/file-data-object.type';
import {HsAddDataVectorService} from '../../vector/vector.service';
import {VectorDataObject} from '../../vector/vector-data.type';

@Component({
  selector: 'hs-advanced-options',
  templateUrl: 'advanced-options.component.html',
})
export class HsAdvancedOptionsComponent implements OnInit {
  @Input() data: FileDataObject & VectorDataObject;
  
  isKml: boolean;
  constructor(private hsAddDataVectorService: HsAddDataVectorService) {}
  ngOnInit(): void {
    this.isKml = this.hsAddDataVectorService.isKml(
      this.data.type,
      this.data.url ?? null
    );
  }
}
