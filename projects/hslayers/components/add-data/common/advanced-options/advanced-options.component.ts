import {Component, Input, OnInit} from '@angular/core';

import {FileDataObject} from 'hslayers-ng/types';
import {HsAddDataVectorService} from 'hslayers-ng/services/add-data';
import {IntersectWithTooltip} from 'hslayers-ng/types';
import {VectorDataObject} from 'hslayers-ng/types';

export type VectorFileDataType = IntersectWithTooltip<
  Partial<FileDataObject> & VectorDataObject
>;

@Component({
  selector: 'hs-advanced-options',
  templateUrl: 'advanced-options.component.html',
})
export class HsAdvancedOptionsComponent implements OnInit {
  @Input() data: VectorFileDataType;

  isKml: boolean;
  constructor(private hsAddDataVectorService: HsAddDataVectorService) {}
  ngOnInit(): void {
    this.isKml = this.hsAddDataVectorService.isKml(
      this.data.type,
      this.data.url ?? null,
    );
  }
}
