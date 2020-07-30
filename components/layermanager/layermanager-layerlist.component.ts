import {Component, Input} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Layer} from 'ol/layer';

@Component({
  selector: 'hs-layermanager-layer-list',
  template: require('./partials/layerlist.html'),
})
export class HsLayerListComponent {
  @Input() folder: any;
  /**
   * @ngdoc property
   * @name hs.layermanager.layerlistDirective#layer_titles
   * @public
   * @type {Array}
   * @description List of layer titles for current folder structure level. List is always ordered in order which should be used in template.
   */
  layer_titles: Array<any> = [];
  filtered_layers: Array<any> = [];

  constructor(
    private HsConfig: HsConfig,
    private HsLayerManagerService: HsLayerManagerService,
    private HsMapService: HsMapService,
    private HsUtilsService: HsUtilsService,
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    private HsLayoutService: HsLayoutService,
    private HsEventBusService: HsEventBusService,
    private HsLayerUtilsService: HsLayerUtilsService
  ) {
    this.HsEventBusService.layerManagerUpdates.subscribe(() => {
      this.sortLayersByPosition();
    });
  }

  /**
   * @function layerLoaded
   * @memberOf hs.layermanager-layerlist
   * @param {Layer} layer Selected layer
   * @description Test if selected layer is loaded in map
   */
  layerLoaded(layer: Layer): boolean {
    return this.HsLayerUtilsService.layerLoaded(layer);
  }

  changeSublayerVisibilityState(layer, state) {
    if (layer.layer.checkedSubLayers) {
      Object.keys(layer.layer.checkedSubLayers).forEach((key) => {
        layer.layer.checkedSubLayers[key] = state;
      });
    }
    if (layer.layer.withChildren) {
      Object.keys(layer.layer.withChildren).forEach((key) => {
        layer.layer.withChildren[key] = state;
      });
    }
  }

  /**
   * @function layerValid
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Test if selected layer is valid (true for invalid)
   */
  layerValid(layer) {
    return this.HsLayerUtilsService.layerInvalid(layer);
  }

  /**
   * @function toggleSublayersVisibility
   * @memberOf hs.layermanager.layerlist
   * @description Controls state of layer´s sublayers checkboxes with layer visibility changes
   * @param {object} layer Selected layer
   */
  toggleSublayersVisibility(layer) {
    if (!layer.visible) {
      if (this.HsLayerManagerService.currentLayer === layer) {
        if (this.HsLayerEditorSublayerService.hasSubLayers()) {
          this.changeSublayerVisibilityState(
            layer,
            this.HsLayerManagerService.currentLayer.visible
          );
        }
      } else {
        this.changeSublayerVisibilityState(layer, layer.visible);
      }
    } else {
      if (layer.layer.checkedSubLayers) {
        Object.keys(layer.layer.checkedSubLayers).forEach((key) => {
          layer.layer.checkedSubLayers[key] =
            layer.layer.checkedSubLayersTmp[key];
        });
      }
      if (layer.layer.withChildren) {
        Object.keys(layer.layer.withChildren).forEach((key) => {
          layer.layer.withChildren[key] = layer.layer.withChildrenTmp[key];
        });
      }
    }
  }
  /**
   * @function toggleLayerEditor
   * @memberOf hs.layermanager.layerlist
   * @description Controls state of layer´s sublayers checkboxes when layermanager.currentLayer is changed
   * @param {object} layer Selected layer
   */
  toggleLayerEditor(layer: Layer, toToggle, control) {
    this.HsLayerManagerService.toggleLayerEditor(layer, toToggle, control);

    if (toToggle === 'sublayers') {
      if (this.HsLayerManagerService.currentLayer) {
        this.HsLayerEditorSublayerService.checkedSubLayers =
          layer.layer.checkedSubLayers;
        this.HsLayerEditorSublayerService.checkedSubLayersTmp =
          layer.layer.checkedSubLayersTmp;

        this.HsLayerEditorSublayerService.withChildren =
          layer.layer.withChildren;
        this.HsLayerEditorSublayerService.withChildrenTmp =
          layer.layer.withChildrenTmp;
      } else {
        this.HsLayerEditorSublayerService.checkedSubLayers = {};
        this.HsLayerEditorSublayerService.withChildren = {};
      }
    }
  }

  ngOnInit() {
    /**
     * @ngdoc property
     * @name hs.layermanager.layerlistDirective#filtered_layers
     * @public
     * @type {Array}
     * @description List of layers which belong to folder hierarchy level of directive instance
     */
    this.filtered_layers = this.filterLayers();
    this.sortLayersByPosition();
  }

  /**
   * @ngdoc method
   * @name hs.layermanager.layerlistDirective#filterLayers
   * @private
   * @description Filters layers, and returns only the ones belonging to folder hiearchy level of directive
   */
  filterLayers() {
    const tmp = [];

    for (const layer of this.HsLayerManagerService.data.layers) {
      if (
        layer.layer.get('path') == this.folder.hsl_path ||
        ((layer.layer.get('path') == undefined ||
          layer.layer.get('path') == '') &&
          this.folder.hsl_path == '')
      ) {
        tmp.push(layer);
      }
    }
    return tmp;
  }

  /**
   * @ngdoc method
   * @name hs.layermanager.layerlistDirective#filtered_layers
   * @public
   * @description Generate list of layer titles out of {@link hs.layermanager.layerlistDirective#filtered_layers filtered_layers}. Complex layer objects cant be used because DragDropList functionality can handle only simple structures.
   */
  generateLayerTitlesArray() {
    this.layer_titles = [];
    for (let i = 0; i < this.filtered_layers.length; i++) {
      this.layer_titles.push(this.filtered_layers[i].title);
    }
  }

  order() {
    return this.HsConfig.layer_order || '-position';
  }

  /**
   * @function isLayerQueryable
   * @memberOf hs.layermanager.controller
   * @param {object} layer_container Selected layer - wrapped in layer object
   * @description Test if layer is queryable (WMS layer with Info format)
   */
  isLayerQueryable(layer_container) {
    this.HsLayerUtilsService.isLayerQueryable(layer_container.layer);
  }

  /**
   * @ngdoc method
   * @name hs.layermanager.layerlistDirective#sortLayersByPosition
   * @private
   * @description Sort layers by computed position
   */
  sortLayersByPosition(): void {
    this.filtered_layers = this.filterLayers();
    const minus = this.order().indexOf('-') == 0;
    const attribute = this.order().replaceAll('-', '');
    this.filtered_layers.sort((a, b) => {
      a = a.layer.get(attribute);
      b = b.layer.get(attribute);
      const tmp = (a < b ? -1 : a > b ? 1 : 0) * (minus ? -1 : 1);
      return tmp;
    });
    this.generateLayerTitlesArray();
  }

  /**
   * @param event
   * @param index
   * @param item
   * @param type
   * @param external
   * @ngdoc method
   * @name hs.layermanager.layerlistDirective#dragged
   * @public
   * @description Callback for dragged event so event can be injected with correct layer titles list needed for correct recalculation.
   */
  dragged(event, index, item, type, external): void {
    this.draggedCont(event, index, item, type, external, this.layer_titles);
  }

  /**
   * @function dragged
   * @memberOf hs.layermanager-layerlist-directive
   * @param {unknown} event
   * @param {number} index
   * @param {unknown} item
   * @param {unknown} type
   * @param {unknown} external
   * @param {Array} layerTitles Array of layer titles of group in which layer should be moved in other position
   * @description Callback for dnd-drop event to change layer position in layer manager structure (drag and drop action with layers in layer manager - see https://github.com/marceljuenemann/angular-drag-and-drop-lists for more info about dnd-drop).
   * This is called from layerlistDirective
   */
  draggedCont(
    event,
    index: number,
    item,
    type,
    external,
    layerTitles: Array<any>
  ): void {
    if (layerTitles.indexOf(item) < index) {
      index--;
    } //Must take into acount that this item will be removed and list will shift
    const to_title = layerTitles[index];
    let to_index = null;
    let item_index = null;
    const layers = this.HsMapService.map.getLayers();
    //Get the position where to drop the item in the map.getLayers list and which item to remove. because we could be working only within a folder so layer_titles is small
    for (let i = 0; i < layers.getLength(); i++) {
      if (layers.item(i).get('title') == to_title) {
        to_index = i;
      }
      if (layers.item(i).get('title') == item) {
        item_index = i;
      }
      if (index > layerTitles.length) {
        to_index = i + 1;
      } //If dragged after the last item
    }
    const layerPanel = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-layerpanel'
    );
    const layerNodes = document
      .querySelector('.hs-lm-list')
      .querySelectorAll('.hs-lm-item');
    let layerNode = layerNodes[layerNodes.length - 1];
    this.HsUtilsService.insertAfter(layerPanel, layerNode);
    const item_layer = layers.item(item_index);
    this.HsMapService.map.getLayers().removeAt(item_index);
    this.HsMapService.map.getLayers().insertAt(to_index, item_layer);
    this.HsLayerManagerService.updateLayerOrder();
    const layerDesc = this.HsLayerManagerService.getLayerDescriptorForOlLayer(
      item_layer
    );
    setTimeout((_) => {
      layerNode = document.getElementById(layerDesc.idString());
      this.HsUtilsService.insertAfter(layerPanel, layerNode);
      this.HsEventBusService.layerManagerUpdates.next();
    }, 300);
  }
}
