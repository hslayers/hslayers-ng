import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsDimensionTimeService} from 'hslayers-ng/shared/get-capabilities';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerListService} from './layer-manager-layerlist.service';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/shared/layer-manager';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {
  getDimension,
  getExclusive,
  getHsLaymanSynchronizing,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-manager-layer-list',
  templateUrl: './layer-manager-layerlist.component.html',
})
export class HsLayerListComponent implements OnInit, OnDestroy {
  @Input() folder: any;
  /**
   * List of layers which belong to folder hierarchy level of directive instance
   */
  filtered_layers: Array<HsLayerDescriptor> = [];
  getHsLaymanSynchronizing = getHsLaymanSynchronizing;
  getExclusive = getExclusive;
  layerManagerUpdatesSubscription: Subscription;
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
    this.layerManagerUpdatesSubscription =
      this.hsEventBusService.layerManagerUpdates.subscribe(() => {
        this.hsLayerManagerService.updateLayerListPositions();
        this.updateLayers();
      });
  }

  ngOnDestroy(): void {
    this.layerManagerUpdatesSubscription.unsubscribe();
  }

  /**
   * Test if selected layer is loaded in map
   * @param layer - Selected layer
   */
  layerLoaded(layer: HsLayerDescriptor): boolean {
    return this.hsLayerUtilsService.layerLoaded(layer);
  }

  /**
   * Test if selected layer is valid
   * @param layer - Selected layer
   * @returns true for invalid layer
   */
  layerValid(layer: HsLayerDescriptor): boolean {
    return this.hsLayerUtilsService.layerInvalid(layer);
  }

  ngOnInit(): void {
    this.filtered_layers = this.hsLayerListService.filterLayers(this.folder);
  }

  layerFilter = (item: HsLayerDescriptor): boolean => {
    const r = new RegExp(this.hsLayerManagerService.data.filter, 'i');
    return r.test(item.title) && item.showInLayerManager;
  };

  showLayerWmsT(layer: HsLayerDescriptor): boolean {
    return (
      this.hsDimensionTimeService.layerIsWmsT(layer) &&
      !getDimension(layer.layer, 'time')?.onlyInEditor
    );
  }

  /**
   * Update layers list
   */
  private updateLayers(): void {
    this.filtered_layers = this.hsLayerListService.filterLayers(this.folder);
  }
}
