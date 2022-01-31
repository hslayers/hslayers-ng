import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';

import {
  getDimension,
  getExclusive,
  getHsLaymanSynchronizing,
} from '../../../common/layer-extensions';

import {HsConfig} from '../../../config.service';
import {HsDimensionTimeService} from '../../../common/get-capabilities/dimension-time.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerDescriptor} from '../layer-descriptor.interface';
import {HsLayerListService} from './layermanager-layerlist.service';
import {HsLayerManagerService} from '../layermanager.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';

@Component({
  selector: 'hs-layermanager-layer-list',
  templateUrl: './layerlist.html',
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
    public hsConfig: HsConfig, //In template
    public hsLayerManagerService: HsLayerManagerService,
    public hsDimensionTimeService: HsDimensionTimeService,
    public hsEventBusService: HsEventBusService,
    public hsLayerUtilsService: HsLayerUtilsService, //In template
    public hsLayerListService: HsLayerListService
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

  layerFilter = (item): boolean => {
    const r = new RegExp(this.hsLayerManagerService.data.filter, 'i');
    return r.test(item.title);
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
    this.hsLayerListService.generateLayerTitlesArray(this.filtered_layers);
  }
}
