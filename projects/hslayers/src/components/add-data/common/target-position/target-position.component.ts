import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLayerDescriptor} from '../../../layermanager/layer-descriptor.interface';
import {HsLayerManagerService} from '../../../layermanager/layermanager.service';
import {HsLayerUtilsService} from '../../../utils/layer-utils.service';

@Component({
  selector: 'hs-target-position',
  templateUrl: './target-position.component.html',
})
export class HsPositionComponent {
  @Input() addUnder: Layer<Source> | null;
  @Output() addUnderChange = new EventEmitter<Layer<Source> | null>();

  constructor(
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLayerManagerService: HsLayerManagerService,
  ) {}

  updateChanges(): void {
    this.addUnderChange.next(this.addUnder);
  }

  /**
   * Filter layers by showInLayermanager property
   * This function is passed as filter pipe function
   */
  layerInManager = (layer: HsLayerDescriptor): boolean => {
    return layer.showInLayerManager;
  };
}
