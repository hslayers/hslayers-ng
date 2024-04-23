import {Component, Input, OnInit} from '@angular/core';
import {Observable, map, of} from 'rxjs';
import {combineLatestWith} from 'rxjs/operators';

import {HsConfig} from 'hslayers-ng/config';
import {HsDimensionTimeService} from 'hslayers-ng/services/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerListService} from './layer-manager-layerlist.service';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
  HsLayermanagerFolder,
} from 'hslayers-ng/services/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {
  getDimension,
  getExclusive,
  getHsLaymanSynchronizing,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-manager-layer-list',
  templateUrl: './layer-manager-layerlist.component.html',
})
export class HsLayerListComponent implements OnInit {
  @Input() folder: HsLayermanagerFolder;
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
  ) {}

  ngOnInit() {
    this.filteredLayers = this.hsLayerManagerService.data.filter.pipe(
      combineLatestWith(of(this.folder.layers)),
      map(([filter, layers]) => this.filterLayers(layers, filter)),
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
    layers: HsLayerDescriptor[],
    filter: string,
  ): HsLayerDescriptor[] {
    const regex = new RegExp(filter, 'i');
    return layers.filter(
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
