import {Component, Input} from '@angular/core';
import {Observable, map} from 'rxjs';
import {combineLatestWith, filter, startWith} from 'rxjs/operators';

import {HsConfig} from 'hslayers-ng/config';
import {HsDimensionTimeService} from 'hslayers-ng/services/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerDescriptor, HsLayermanagerFolder} from 'hslayers-ng/types';
import {HsLayerListService} from './layer-manager-layerlist.service';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {
  getDimension,
  getExclusive,
  getHsLaymanSynchronizing,
} from 'hslayers-ng/common/extensions';
import {toObservable} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hs-layer-manager-layer-list',
  templateUrl: './layer-manager-layerlist.component.html',
})
export class HsLayerListComponent {
  @Input({required: true}) folder: string;
  /**
   * List of layers which belong to folder hierarchy level of directive instance
   */
  filteredLayers: Observable<HsLayerDescriptor[]>;
  getHsLaymanSynchronizing = getHsLaymanSynchronizing;
  getExclusive = getExclusive;
  constructor(
    public hsConfig: HsConfig,
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayerSelectorService: HsLayerSelectorService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsEventBusService: HsEventBusService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsLayerListService: HsLayerListService,
    public hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
  ) {
    this.filteredLayers = this.hsLayerManagerService.data.filter.pipe(
      startWith(''),
      combineLatestWith(
        toObservable(this.hsLayerManagerService.data.folders).pipe(
          map((folders) => {
            return folders.get(this.folder);
          }),
          startWith({layers: [], zIndex: 0}),
        ),
      ),
      filter(([_, folder]) => !!folder),
      map(([filter, folder]) => this.filterLayers(folder, filter)),
    );
  }

  /**
   * Test if selected layer is valid
   * @param layer - Selected layer
   * @returns true for invalid layer
   */
  layerValid(layer: HsLayerDescriptor): boolean {
    return this.hsLayerUtilsService.layerInvalid(layer);
  }

  filterLayers(
    folder: HsLayermanagerFolder,
    filter: string,
  ): HsLayerDescriptor[] {
    const regex = new RegExp(filter, 'i');
    return folder.layers.filter(
      (layer) => regex.test(layer.title) && layer.showInLayerManager,
    );
  }

  showLayerWmsT(layer: HsLayerDescriptor): boolean {
    return (
      this.hsDimensionTimeService.layerIsWmsT(layer) &&
      !getDimension(layer.layer, 'time')?.onlyInEditor
    );
  }
}
