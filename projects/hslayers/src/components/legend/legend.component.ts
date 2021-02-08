import Map from 'ol/Map';
import {Component} from '@angular/core';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLegendDescriptor} from './legend-descriptor.interface';
import {HsLegendService} from './legend.service';
import {HsMapService} from '../map/map.service';
import {Layer} from 'ol/layer';
@Component({
  selector: 'hs-legend',
  templateUrl: './partials/legend.html',
})
export class HsLegendComponent {
  layerDescriptors = [];

  constructor(
    public HsLegendService: HsLegendService,
    public HsMapService: HsMapService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.HsMapService.loaded().then((map) => this.init(map));
    //this.$emit('scope_loaded', 'Legend');
  }

  /**
   * Add selected layer to the list of layers in legend (with event listener
   * to display/hide legend item when layer visibility change)
   *
   * @memberof hs.legend.controller
   * @function addLayerToLegends
   * @param {object} layer Layer to add legend for
   */
  addLayerToLegends(layer): void {
    const descriptor = this.HsLegendService.getLayerLegendDescriptor(layer);
    if (descriptor) {
      this.layerDescriptors.push(descriptor);
      layer.on('change:visible', (e) => this.layerVisibilityChanged(e));
      layer.on('change:legends', (e) => {
        const oldDescriptor = this.findLayerDescriptor(e.target);
        this.layerDescriptors[
          this.layerDescriptors.indexOf(oldDescriptor)
        ] = this.HsLegendService.getLayerLegendDescriptor(e.target);
      });
      layer.getSource().on('change', (e) => this.layerSourcePropChanged(e));
    }
  }

  rebuildLegends() {
    this.layerDescriptors = [];
    this.buildLegendsForLayers(this.HsMapService.map);
  }

  filterDescriptors(): any[] {
    return this.layerDescriptors;
  }

  /**
   * Check if there is any visible layer
   *
   * @memberof hs.legend.controller
   * @returns {boolean} Returns true if no layers with legend exist
   * @function noLayerExists
   */
  noLayerExists(): boolean {
    const visibleLayers = this.layerDescriptors.filter(
      (check) => check.visible
    );
    return visibleLayers.length == 0;
  }

  /**
   * Remove selected layer from legend items
   *
   * @memberof hs.legend.controller
   * @function removeLayerFromLegends
   * @param {Layer} layer Layer to remove from legend
   */
  removeLayerFromLegends(layer: Layer): void {
    for (let i = 0; i < this.layerDescriptors.length; i++) {
      if (this.layerDescriptors[i].lyr == layer) {
        this.layerDescriptors.splice(i, 1);
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
   *
   * @memberof hs.legend.controller
   * @function layerAdded
   * @param {object} e Event object, should have element property
   */
  layerAdded(e): void {
    this.addLayerToLegends(e.element);
  }

  /**
   * @param e event description
   */
  layerVisibilityChanged(e): void {
    const descriptor = this.findLayerDescriptor(e.target);
    if (descriptor) {
      descriptor.visible = e.target.getVisible();
    }
  }

  /**
   * @param e event description
   */
  layerSourcePropChanged(e): void {
    const descriptor = this.findLayerDescriptorBySource(e.target);
    if (descriptor) {
      const newDescriptor = this.HsLegendService.getLayerLegendDescriptor(
        descriptor.lyr
      );

      if (
        newDescriptor.subLayerLegends != descriptor.subLayerLegends ||
        newDescriptor.title != descriptor.title
      ) {
        this.layerDescriptors[
          this.layerDescriptors.indexOf(descriptor)
        ] = newDescriptor;
      }
    }
  }

  /**
   * Finds layer descriptor for openlayers layer
   *
   * @returns {object} Object describing the legend
   * @param {ol/layer} layer OpenLayers layer
   */
  findLayerDescriptor(layer): HsLegendDescriptor {
    return this.layerDescriptors.find((ld) => ld.lyr == layer);
  }

  /**
   * @param source
   */
  findLayerDescriptorBySource(source) {
    const found = this.layerDescriptors.filter(
      (ld) => ld.lyr.getSource() == source
    );
    if (found.length > 0) {
      return found[0];
    }
  }
}
