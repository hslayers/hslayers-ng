import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLayerManagerService} from '../../../../layermanager/layermanager.service';
import {HsLayerUtilsService} from '../../../../utils/layer-utils.service';

@Component({
  selector: 'hs-add-data-target-position',
  templateUrl: './add-data-target-position.component.html',
})
export class HsAddDataTargetPositionComponent {
  @Input() addUnder: Layer<Source> | null; // @type'; TODO: comes from another scope
  @Output() addUnderChange = new EventEmitter<Layer<Source> | null>();

  constructor(
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLayerManagerService: HsLayerManagerService
  ) {}

  updateChanges(): void {
    this.addUnderChange.next(this.addUnder);
  }
}
