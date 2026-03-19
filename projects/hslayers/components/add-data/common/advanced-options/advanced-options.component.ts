import {Component, Input, OnInit, inject} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgClass} from '@angular/common';
import {TranslatePipe} from '@ngx-translate/core';

import {
  FileDataObject,
  IntersectWithTooltip,
  VectorDataObject,
} from 'hslayers-ng/types';
import {HsAddDataVectorService} from 'hslayers-ng/services/add-data';
import {HsPositionComponent} from '../target-position/target-position.component';

export type VectorFileDataType = IntersectWithTooltip<
  Partial<FileDataObject> & VectorDataObject
>;

@Component({
  selector: 'hs-advanced-options',
  templateUrl: 'advanced-options.component.html',
  imports: [FormsModule, HsPositionComponent, NgClass, TranslatePipe],
})
export class HsAdvancedOptionsComponent implements OnInit {
  private hsAddDataVectorService = inject(HsAddDataVectorService);

  @Input() data: VectorFileDataType;

  isKml: boolean;
  ngOnInit(): void {
    this.isKml = this.hsAddDataVectorService.isKml(
      this.data.type,
      this.data.url ?? null,
    );
  }
}
