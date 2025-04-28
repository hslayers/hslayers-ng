import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';

@Component({
  selector: 'hs-target-position',
  templateUrl: './target-position.component.html',
  standalone: false,
})
export class HsPositionComponent {
  @Input() addUnder: Layer<Source> | null;
  @Output() addUnderChange = new EventEmitter<Layer<Source> | null>();

  constructor(public hsLayerManagerService: HsLayerManagerService) {}

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
