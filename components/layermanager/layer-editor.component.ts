/* eslint-disable angular/definedundefined */
import * as moment from 'moment';
import BaseLayer from 'ol/layer/Base';
import {Component, Input} from '@angular/core';
import {HsDrawService} from '../draw/draw.service.js';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.class';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service.js';
import {HsLayoutService} from '../layout/layout.service.js';
import {HsMapService} from '../map/map.service.js';
import {HsStylerService} from '../styles/styler.service';

@Component({
  selector: 'hs-layer-editor',
  template: require('./partials/layer-editor.html'),
})
export class HsLayerEditorComponent {
  @Input('current-layer') currentLayer: HsLayerDescriptor;
  distance = {
    value: 40,
  };
  layer_renamer_visible = false;

  constructor(
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLayerManagerWmstService: HsLayerManagerWmstService,
    private HsStylerService: HsStylerService,
    private HsMapService: HsMapService,
    private HsLayerManagerService: HsLayerManagerService,
    private HsLayoutService: HsLayoutService,
    private HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    private HsLayerEditorService: HsLayerEditorService,
    private HsDrawService: HsDrawService,
    private HsEventBusService: HsEventBusService,
    private HsLayerManagerMetadataService: HsLayerManagerMetadataService // Used in template
  ) {}

  ngOnChanges() {
    if (!this.currentLayer) {
      return;
    }
    this.HsLayerEditorService.setLayer(this.currentLayer);
  }

  layerIsWmsT() {
    return this.HsLayerManagerWmstService.layerIsWmsT(this.currentLayer);
  }

  /**
   * @function isLayerWMS
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Test if layer is WMS layer
   * @deprecated TODO
   */
  isLayerWMS(layer) {
    return this.HsLayerUtilsService.isLayerWMS(layer);
  }

  /**
   * @function zoomToLayer
   * @memberOf hs.layermanager.controller
   * @description Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabalities request (for WMS layer)
   * @returns {Promise}
   */
  zoomToLayer() {
    return this.HsLayerEditorService.zoomToLayer(this.olLayer());
  }

  /**
   * @function styleLayer
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Display styler panel for selected layer, so user can change its style
   */
  styleLayer() {
    const layer = this.olLayer();
    this.HsStylerService.layer = layer;
    this.HsLayoutService.setMainPanel('styler');
  }

  /**
   * @function isLayerVectorLayer
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Test if layer is WMS layer
   */
  isLayerVectorLayer(layer) {
    return this.HsLayerUtilsService.isLayerVectorLayer(layer);
  }

  /**
   * @function isVectorLayer
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Test if layer is WMS layer
   */
  isVectorLayer() {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    if (!this.isLayerVectorLayer(layer)) {
      return;
    } else {
      return true;
    }
  }

  /**
   * @function Declutter
   * @memberOf hs.layermanager.controller
   * @param {boolean} newValue To declutter or not to declutter
   * @description Set decluttering of features
   * @returns {boolean} Current declutter state
   */
  set declutter(newValue) {
    this.HsLayerEditorService.declutter(this.olLayer(), newValue);
  }

  get declutter() {
    return this.HsLayerEditorService.declutter(this.olLayer(), undefined);
  }

  /**
   * @function cluster
   * @memberOf hs.layermanager.controller
   * @description Set cluster for layer
   * @param {boolean} newValue To cluster or not to cluster
   * @returns {boolean} Current cluster state
   */
  set cluster(newValue) {
    if (!this.currentLayer) {
      return;
    }
    this.HsLayerEditorService.cluster(
      this.olLayer(),
      newValue,
      this.distance.value
    );
  }

  get cluster() {
    if (!this.currentLayer) {
      return;
    }
    return this.HsLayerEditorService.cluster(
      this.olLayer(),
      undefined,
      this.distance.value
    );
  }

  /**
   * @function changeDistance
   * @memberOf hs.layermanager.controller
   * @description Set distance between cluster features;
   */
  changeDistance() {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    if (layer.getSource().setDistance == undefined) {
      return;
    }
    layer.getSource().setDistance(this.distance.value);
  }

  /**
   * @function toggleLayerRename
   * @memberOf hs.layermanager.controller
   * @description Toogle layer rename control on panel (through layer rename variable)
   */
  toggleLayerRename() {
    this.layer_renamer_visible = !this.layer_renamer_visible;
  }

  showRemoveLayerDiag(e, layer) {
    try {
      //TODO
      console.error('not implemented');

      /* const $mdDialog = $injector.get('$mdDialog');

      const confirm = $mdDialog
        .confirm()
        .title('Remove layer ' + layer.title)
        .textContent('Are you sure about layer removal?')
        .ariaLabel('Confirm layer removal')
        .targetEvent(e)
        .ok('Remove')
        .cancel('Cancel')
        .hasBackdrop(false);

      $mdDialog.show(confirm).then(
        () => {
          this.removeLayer();
        },
        () => { }
      ); */
    } catch (ex) {}
  }

  /**
   * @function opacity
   * @memberOf hs.layermanager.controller
   * @description Set selected layers opacity and emits "compositionchanged"
   * @param newValue
   */
  set opacity(newValue) {
    if (!this.currentLayer) {
      return;
    }
    this.olLayer().setOpacity(newValue);
    this.HsEventBusService.compositionEdits.next();
  }

  get opacity() {
    return this.olLayer().getOpacity();
  }

  /**
   * @function layerIsZoomable
   * @memberOf hs.layermanager.controller
   * @description Determines if layer has BoundingBox defined as
   * its metadata or is a Vector layer. Used for setting visibility
   * of 'Zoom to ' button
   * @param {Ol.layer} layer Selected layer
   */
  layerIsZoomable() {
    return this.HsLayerUtilsService.layerIsZoomable(this.olLayer());
  }

  /**
   * @function layerIsStyleable
   * @memberOf hs.layermanager.controller
   * @description Determines if layer is a Vector layer and
   * styleable. Used for allowing styling
   * @param {Ol.layer} layer Selected layer
   */
  layerIsStyleable() {
    return this.HsLayerUtilsService.layerIsStyleable(this.olLayer());
  }

  /**
   * @function hasCopyright
   * @memberOf hs.layermanager.controller
   * @description Determines if layer has copyright information avaliable *
   * @param {Ol.layer} layer Selected layer (LayMan.currentLayer)
   */
  hasCopyright(layer) {
    if (!this.currentLayer) {
      return;
    } else {
      if (layer.layer.get('Attribution')) {
        const attr = layer.layer.get('Attribution');
        return attr.OnlineResource ? true : false;
      } else {
        return false;
      }
    }
  }

  /**
   * @function minResolution
   * @memberOf hs.layermanager.controller
   * @description Set min resolution for selected layer
   * @param newValue
   */
  set minResolution(newValue) {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    layer.setMinResolution(newValue);
  }

  get minResolution() {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    return layer.minResolution;
  }

  /**
   * @function minResolution
   * @memberOf hs.layermanager.controller
   * @description Set max resolution for selected layer
   * @param newValue
   */
  maxResolution(newValue) {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    if (arguments.length) {
      layer.setMaxResolution(newValue);
    } else {
      return layer.maxResolution;
    }
  }

  /**
   * @function isLayerRemovable
   * @memberOf hs.layermanager.controller
   * @description Check if layer can be removed based on 'removable'
   * layer attribute
   */
  isLayerRemovable() {
    const layer = this.olLayer();
    return (
      layer != undefined &&
      (layer.get('removable') == undefined || layer.get('removable') == true)
    );
  }

  removeLayer() {
    if (this.HsDrawService.selectedLayer == this.olLayer()) {
      this.HsDrawService.selectedLayer = null;
    }
    this.HsMapService.map.removeLayer(this.olLayer());
    this.HsDrawService.fillDrawableLayers();

    this.HsEventBusService.layerManagerUpdates.next();
  }

  /**
   * @function isScaleVisible
   * @memberOf hs.layermanager.controller
   * @param {Ol.layer} layer Selected layer
   * @description Test if layer has min and max relolution set
   */
  isScaleVisible() {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return this.minResolutionValid() || this.maxResolutionValid();
  }

  olLayer(): BaseLayer {
    if (!this.currentLayer) {
      return undefined;
    }
    return this.currentLayer.layer;
  }

  minResolutionValid() {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return (
      layer.getMinResolution() != undefined && layer.getMinResolution() != 0
    );
  }

  maxResolutionValid() {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return (
      layer.getMaxResolution() != undefined &&
      layer.getMaxResolution() != Infinity
    );
  }

  /**
   * @function title
   * @memberOf hs.layermanager.controller
   * @param {string} newTitle New title to set
   * @desription Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
   * @returns {string} Title
   */
  set title(newTitle) {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    layer.title = newTitle;
    layer.set('title', newTitle);
  }

  get title() {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return layer.get('title');
  }

  set abstract(newAbstract) {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    layer.set('abstract', newAbstract);
  }

  get abstract() {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return layer.get('abstract');
  }

  hasSubLayers() {
    if (this.currentLayer === null) {
      return;
    }
    const subLayers = this.currentLayer.layer.get('Layer');
    return subLayers != undefined && subLayers.length > 0;
  }

  getSubLayers() {
    return this.HsLayerEditorSublayerService.getSubLayers();
  }

  //TODO refactor to some helper service
  /**
   * @function dateToNonUtc
   * @memberOf hs.layermanager.controller
   * @param {Date} d Date to convert
   * @description Convert date to non Utc format
   * @returns {Date} Date with timezone added
   */
  dateToNonUtc(d) {
    if (d == undefined) {
      return;
    }
    const noutc = new Date(d.valueOf() + d.getTimezoneOffset() * 60000);
    return noutc;
  }

  //TODO refactor to some helper service
  formatDate(date, format) {
    return moment(date).format(format);
  }
}
