import moment from 'moment';
import {Component, Input} from '@angular/core';
import {HsDrawService} from '../draw/draw.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerEditorService} from './layer-editor.service';
import {HsLayerEditorSublayerService} from './layer-editor.sub-layer.service';
import {HsLayerManagerMetadataService} from './layermanager-metadata.service';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsStylerService} from '../styles/styler.service';
import {Layer} from 'ol/layer';

@Component({
  selector: 'hs-layer-editor',
  templateUrl: './partials/layer-editor.html',
})
export class HsLayerEditorComponent {
  @Input('current-layer') currentLayer: HsLayerDescriptor;
  distance = {
    value: 40,
  };
  layer_renamer_visible = false;

  constructor(
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsLayerManagerWmstService: HsLayerManagerWmstService,
    public HsStylerService: HsStylerService,
    public HsMapService: HsMapService,
    public HsLayerManagerService: HsLayerManagerService,
    public HsLayoutService: HsLayoutService,
    public HsLayerEditorSublayerService: HsLayerEditorSublayerService,
    public HsLayerEditorService: HsLayerEditorService,
    public HsDrawService: HsDrawService,
    public HsEventBusService: HsEventBusService,
    public HsLayerManagerMetadataService: HsLayerManagerMetadataService // Used in template
  ) {}

  layerIsWmsT(): boolean {
    return this.HsLayerManagerWmstService.layerIsWmsT(this.currentLayer);
  }

  /**
   * @function zoomToLayer
   * @memberOf HsLayerEditorComponent
   * @description Zoom to selected layer (layer extent). Get extent
   * from bounding box property, getExtent() function or from
   * BoundingBox property of GetCapabalities request (for WMS layer)
   * @returns {Promise}
   */
  zoomToLayer(): Promise<any> {
    return this.HsLayerEditorService.zoomToLayer(this.olLayer());
  }

  /**
   * @function styleLayer
   * @memberOf HsLayerEditorComponent
   * @description Display styler panel for selected layer, so user can change its style
   */
  styleLayer(): void {
    const layer = this.olLayer();
    this.HsStylerService.layer = layer;
    this.HsLayoutService.setMainPanel('styler');
  }

  /**
   * @function isLayerVectorLayer
   * @memberOf HsLayerEditorComponent
   * @param {Layer} layer Selected layer
   * @description Test if layer is WMS layer
   */
  isLayerVectorLayer(layer: Layer): boolean {
    return this.HsLayerUtilsService.isLayerVectorLayer(layer);
  }

  /**
   * @function isVectorLayer
   * @memberOf HsLayerEditorComponent
   * @description Test if layer is WMS layer
   */
  isVectorLayer(): boolean | undefined {
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
   * @memberOf HsLayerEditorComponent
   * @param {boolean} newValue To declutter or not to declutter
   * @description Set decluttering of features
   * @returns {boolean} Current declutter state
   */
  set declutter(newValue: boolean) {
    this.HsLayerEditorService.declutter(this.olLayer(), newValue);
  }

  get declutter(): boolean {
    return this.HsLayerEditorService.declutter(this.olLayer(), undefined);
  }

  /**
   * @function cluster
   * @memberOf HsLayerEditorComponent
   * @description Set cluster for layer
   * @param {boolean} newValue To cluster or not to cluster
   * @returns {boolean} Current cluster state
   */
  set cluster(newValue: boolean) {
    if (!this.currentLayer) {
      return;
    }
    this.HsLayerEditorService.cluster(
      this.olLayer(),
      newValue,
      this.distance.value
    );
  }

  get cluster(): boolean | undefined {
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
   * @memberOf HsLayerEditorComponent
   * @description Set distance between cluster features;
   */
  changeDistance(): void {
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
   * @memberOf HsLayerEditorComponent
   * @description Toogle layer rename control on panel (through layer rename variable)
   */
  toggleLayerRename(): void {
    this.layer_renamer_visible = !this.layer_renamer_visible;
  }

  showRemoveLayerDiag(e, layer): void {
    try {
      //TODO:
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
   * @memberOf HsLayerEditorComponent
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
   * @memberOf HsLayerEditorComponent
   * @description Determines if selected layer has BoundingBox defined as
   * its metadata or is a Vector layer. Used for setting visibility
   * of 'Zoom to ' button
   */
  layerIsZoomable(): boolean {
    return this.HsLayerUtilsService.layerIsZoomable(this.olLayer());
  }

  /**
   * @function layerIsStyleable
   * @memberOf HsLayerEditorComponent
   * @description Determines if selected layer is a Vector layer and
   * styleable. Used for allowing styling
   */
  layerIsStyleable(): boolean {
    return this.HsLayerUtilsService.layerIsStyleable(this.olLayer());
  }

  /**
   * @function hasCopyright
   * @memberOf HsLayerEditorComponent
   * @description Determines if layer has copyright information avaliable *
   * @param {HsLayerDescriptor} layer Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
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
   * @memberOf HsLayerEditorComponent
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
    return layer.getMinResolution();
  }

  /**
   * @function maxResolution
   * @memberOf HsLayerEditorComponent
   * @description Set max resolution for selected layer
   * @param newValue
   */
  set maxResolution(newValue) {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    layer.setMaxResolution(newValue);
  }

  get maxResolution() {
    if (!this.currentLayer) {
      return;
    }
    const layer = this.olLayer();
    return layer.getMaxResolution();
  }

  /**
   * @function isLayerRemovable
   * @memberOf HsLayerEditorComponent
   * @description Check if layer can be removed based on 'removable'
   * layer attribute
   */
  isLayerRemovable(): boolean {
    const layer = this.olLayer();
    return (
      layer?.get('removable') == undefined || layer?.get('removable') == true
    );
  }

  removeLayer(): void {
    if (this.HsDrawService.selectedLayer == this.olLayer()) {
      this.HsDrawService.selectedLayer = null;
    }
    this.HsMapService.map.removeLayer(this.olLayer());
    this.HsDrawService.fillDrawableLayers();

    this.HsEventBusService.layerManagerUpdates.next();
  }

  /**
   * @function isScaleVisible
   * @memberOf HsLayerEditorComponent
   * @description Test if selected layer has min and max relolution set
   */
  isScaleVisible(): boolean {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return this.minResolutionValid() || this.maxResolutionValid();
  }

  olLayer(): Layer {
    if (!this.currentLayer) {
      return undefined;
    }
    return this.currentLayer.layer;
  }

  minResolutionValid(): boolean {
    const layer = this.olLayer();
    if (layer == undefined) {
      return false;
    }
    return (
      layer.getMinResolution() != undefined && layer.getMinResolution() != 0
    );
  }

  maxResolutionValid(): boolean {
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
   * Change title of layer (Angular automatically change title in object wrapper but it is needed to manually change in Ol.layer object)
   * @param newTitle - New title to set
   * @returns Title
   */
  set title(newTitle: string) {
    const newLayerTitle = newTitle.trim();
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    layer.title = newLayerTitle;
    this.HsLayerEditorService.layerTitleChange.next({
      newTitle: newLayerTitle,
      oldTitle: layer.get('title'),
      layer,
    });
    layer.set('title', newLayerTitle);
    this.HsEventBusService.layerManagerUpdates.next();
  }

  get title(): string {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    return layer.get('title');
  }

  set abstract(newAbstract: string) {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    layer.set('abstract', newAbstract);
  }

  get abstract(): string {
    const layer = this.olLayer();
    if (layer == undefined) {
      return;
    }
    return layer.get('abstract');
  }

  hasSubLayers(): boolean | undefined {
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
   * @memberOf HsLayerEditorComponent
   * @param {Date} d Date to convert
   * @description Convert date to non Utc format
   * @returns {Date} Date with timezone added
   */
  dateToNonUtc(d: Date): Date | undefined {
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
