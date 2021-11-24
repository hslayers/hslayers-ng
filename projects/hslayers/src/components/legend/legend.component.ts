import Map from 'ol/Map';
import {Component} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsLanguageService} from '../language/language.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLegendDescriptor} from './legend-descriptor.interface';
import {HsLegendService} from './legend.service';
import {HsMapService} from '../map/map.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsQueuesService} from '../../common/queues/queues.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-legend',
  templateUrl: './legend.component.html',
})
export class HsLegendComponent extends HsPanelBaseComponent {
  layerDescriptors = [];
  titleSearch = '';
  name = 'legend';

  constructor(
    public hsLegendService: HsLegendService,
    public hsMapService: HsMapService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsUtilsService: HsUtilsService,
    public hsQueuesService: HsQueuesService,
    hsLayoutService: HsLayoutService,
    hsLanguageService: HsLanguageService,
    hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'legend',
      module: 'hs.legend',
      order: 1,
      fits: true,
      title: () => hsLanguageService.getTranslation('PANEL_HEADER.LEGEND'),
      description: () =>
        hsLanguageService.getTranslation('SIDEBAR.descriptions.LEGEND'),
      icon: 'icon-dotlist',
    });
    this.hsMapService.loaded().then((map) => this.init(map));
  }

  /**
   * Add selected layer to the list of layers in legend (with event listener
   * to display/hide legend item when layer visibility change)
   * @param layer - Layer to add legend for
   */
  async addLayerToLegends(layer: Layer<Source>): Promise<void> {
    const descriptor = await this.hsLegendService.getLayerLegendDescriptor(
      layer
    );
    if (descriptor) {
      this.layerDescriptors.push(descriptor);
      this.refreshList();
      layer.on('change:visible', (e) => this.layerVisibilityChanged(e));
      if (this.hsLayerUtilsService.isLayerWMS(layer)) {
        layer.getSource().on('change', (e) => {
          this.hsUtilsService.debounce(
            this.layerSourcePropChanged(e),
            100,
            false,
            this
          );
        });
      }
    }
  }

  rebuildLegends(): void {
    this.layerDescriptors = [];
    this.buildLegendsForLayers(this.hsMapService.map);
  }

  filterDescriptors(): any[] {
    return this.layerDescriptors;
  }

  legendFilter = (item): boolean => {
    const r = new RegExp(this.titleSearch, 'i');
    return r.test(item.title);
  };

  /**
   * Check if there is any visible layer
   * @returns Returns true if no layers with legend exist
   */
  noLayerExists(): boolean {
    const visibleLayers = this.layerDescriptors.filter(
      (check) => check.visible
    );
    return visibleLayers.length == 0;
  }

  /**
   * Remove selected layer from legend items
   * @param layer - Layer to remove from legend
   */
  removeLayerFromLegends(layer: Layer<Source>): void {
    for (let i = 0; i < this.layerDescriptors.length; i++) {
      if (this.layerDescriptors[i].lyr == layer) {
        this.layerDescriptors.splice(i, 1);
        this.refreshList();
        break;
      }
    }
  }

  /**
   * @param map
   */
  init(map: Map): void {
    map.getLayers().on('add', (e) => this.layerAdded(e));
    map.getLayers().on('remove', (e) => {
      this.removeLayerFromLegends(e.element);
    });
    this.buildLegendsForLayers(map);
  }

  buildLegendsForLayers(map: Map): void {
    map.getLayers().forEach((lyr) => {
      this.layerAdded({
        element: lyr,
      });
    });
  }

  /**
   * (PRIVATE) Callback function for adding layer to map, add layers legend
   * @param e - Event object, should have element property
   */
  layerAdded(e): void {
    const que = this.hsQueuesService.ensureQueue('addLayerToLegends', 3);
    que.push(async (cb) => {
      await this.addLayerToLegends(e.element);
      cb(null);
    });
  }

  /**
   * @param e - event description
   */
  layerVisibilityChanged(e): void {
    const descriptor = this.findLayerDescriptor(e.target);
    if (descriptor) {
      descriptor.visible = e.target.getVisible();
    }
  }

  /**
   * @param e - event description
   */
  layerSourcePropChanged(e): void {
    const descriptor = this.findLayerDescriptorBySource(e.target);
    if (descriptor) {
      this.hsLegendService
        .getLayerLegendDescriptor(descriptor.lyr)
        .then((newDescriptor) => {
          if (
            newDescriptor.subLayerLegends != descriptor.subLayerLegends ||
            newDescriptor.title != descriptor.title
          ) {
            this.layerDescriptors[this.layerDescriptors.indexOf(descriptor)] =
              newDescriptor;
          }
        });
    }
  }
  /**
   * Finds layer descriptor for OpenLayers layer
   * @param layer - OpenLayers layer
   * @returns Object describing the legend
   */
  findLayerDescriptor(layer: Layer<Source>): HsLegendDescriptor {
    return this.layerDescriptors.find((ld) => ld.lyr == layer);
  }

  /**
   * @param source -
   */
  findLayerDescriptorBySource(source: Source): any {
    const found = this.layerDescriptors.filter(
      (ld) => ld.lyr.getSource() == source
    );
    if (found.length > 0) {
      return found[0];
    }
  }

  refreshList(): void {
    this.layerDescriptors = Array.from(this.layerDescriptors);
  }
}
