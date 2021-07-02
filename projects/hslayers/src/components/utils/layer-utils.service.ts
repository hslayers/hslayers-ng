import {
  Cluster,
  ImageWMS,
  TileWMS,
  Vector as VectorSource,
  WMTS,
  XYZ,
} from 'ol/source';
import {GeoJSON, KML, TopoJSON} from 'ol/format';
import {
  Image as ImageLayer,
  Layer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
import {Injectable} from '@angular/core';
import {isEmpty} from 'ol/extent';

import {HsLanguageService} from '../language/language.service';
import {HsLayerDescriptor} from '../layermanager/layer-descriptor.interface';
import {HsUtilsService} from './utils.service';
import {
  getCluster,
  getEditor,
  getName,
  getShowInLayerManager,
  getTitle,
} from '../../common/layer-extensions';

@Injectable()
export class HsLayerUtilsService {
  constructor(
    public HsUtilsService: HsUtilsService,
    public HsLanguageService: HsLanguageService
  ) {}

  /**
   * Determines if layer has properties needed for 'Zoom to layer' function.
   * @param layer - Selected layer
   * @returns True for layer with BoundingBox property, for
   * WMS layer or for layer, which has source with extent
   */
  layerIsZoomable(layer: Layer): boolean {
    if (typeof layer == 'undefined') {
      return false;
    }
    if (layer.getExtent()) {
      return true;
    }
    if (this.isLayerWMS(layer)) {
      return true;
    }
    if (
      layer.getSource().getExtent &&
      layer.getSource().getExtent() &&
      !isEmpty(layer.getSource().getExtent())
    ) {
      return true;
    }
    return false;
  }

  /**
   * Determines if layer is a Vector layer and therefore styleable
   * @param layer - Selected layer
   * @returns True for ol.layer.Vector
   */
  layerIsStyleable(layer: Layer): boolean {
    if (typeof layer == 'undefined') {
      return false;
    }
    if (
      this.HsUtilsService.instOf(
        layer,
        VectorLayer
      ) /*&& layer.getSource().styleAble*/
    ) {
      return true;
    }
    return false;
  }

  /**
   * Test if layer is queryable (WMS layer with Info format)
   * @param layer - Selected layer
   * @returns True for ol.layer.Tile and ol.layer.Image with
   * INFO_FORMAT in params
   */
  isLayerQueryable(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(layer, Tile) &&
      this.HsUtilsService.instOf(layer.getSource(), TileWMS) &&
      layer.getSource().getParams().INFO_FORMAT
    ) {
      return true;
    }
    if (
      this.HsUtilsService.instOf(layer, ImageLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS) &&
      layer.getSource().getParams().INFO_FORMAT
    ) {
      return true;
    }
    return false;
  }

  /**
   * Get title of selected layer
   * @param layer - to get layer title
   * @returns Layer title or "Void"
   */
  getLayerTitle(layer: Layer): string {
    if (getTitle(layer) !== undefined && getTitle(layer) != '') {
      return getTitle(layer).replace(/&#47;/g, '/');
    } else {
      return 'Void';
    }
  }

  // todo
  getURL(layer: Layer): string {
    let url;
    if (layer.getSource().getUrls) {
      //Multi tile
      url = layer.getSource().getUrls();
      if (url) {
        //in case WMTS source has not yet been set
        url = url[0];
      }
    }
    if (layer.getSource().getUrl) {
      //Single tile
      url = layer.getSource().getUrl();
    }
    return url;
  }

  /**
   * Test if layer is WMS layer
   * @param layer - Selected layer
   * @returns True for ol.layer.Tile and ol.layer.Image
   */
  isLayerWMS(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(layer, Tile) &&
      this.HsUtilsService.instOf(layer.getSource(), TileWMS)
    ) {
      return true;
    }
    if (
      this.HsUtilsService.instOf(layer, ImageLayer) &&
      this.HsUtilsService.instOf(layer.getSource(), ImageWMS)
    ) {
      return true;
    }
    return false;
  }

  // todo
  isLayerWMTS(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(layer, Tile) &&
      this.HsUtilsService.instOf(layer.getSource(), WMTS)
    ) {
      return true;
    }
    return false;
  }

  isLayerXYZ(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(layer, Tile) &&
      this.HsUtilsService.instOf(layer.getSource(), XYZ)
    ) {
      return true;
    }
    return false;
  }

  getLayerSourceFormat(layer: Layer): string {
    if (!this.isLayerVectorLayer(layer)) {
      return;
    }
    return layer.getSource()?.getFormat();
  }

  /**
   * Test if layer is Vector layer
   * @param layer - Selected layer
   * @returns True for Vector layer
   */
  isLayerVectorLayer(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      (this.HsUtilsService.instOf(layer.getSource(), Cluster) ||
        this.HsUtilsService.instOf(layer.getSource(), VectorSource))
    ) {
      return true;
    }
    return false;
  }

  /**
   * Test if the features in the vector layer come from a GeoJSON source
   * @param layer - an OL vector layer
   * @returns true only if the GeoJSON format is explicitly specified in the source. False otherwise.
   */
  isLayerGeoJSONSource(layer: Layer): boolean {
    if (this.HsUtilsService.instOf(this.getLayerSourceFormat(layer), GeoJSON)) {
      return true;
    }
    return false;
  }

  /**
   * Test if the features in the vector layer come from a TopoJSON source
   * @param layer - an OL vector layer
   * @returns true only if the TopoJSON format is explicitly specified in the source. False otherwise.
   */
  isLayerTopoJSONSource(layer: Layer): boolean {
    if (
      this.HsUtilsService.instOf(this.getLayerSourceFormat(layer), TopoJSON)
    ) {
      return true;
    }
    return false;
  }

  /**
   * Test if the features in the vector layer come from a KML source
   * @param layer - an OL vector layer
   * @returns true only if the KML format is explicitly specified in the source. False otherwise.
   */
  isLayerKMLSource(layer: Layer): boolean {
    if (this.HsUtilsService.instOf(this.getLayerSourceFormat(layer), KML)) {
      return true;
    }
    return false;
  }

  /**
   * Test if layer is shown in layer switcher
   * (if not some internal hslayers layer like selected feature layer)
   * @param layer - Layer to check
   * @returns True if showInLayerManager attribute is set to true
   */
  isLayerInManager(layer: Layer): boolean {
    return (
      getShowInLayerManager(layer) === undefined ||
      getShowInLayerManager(layer) == true
    );
  }

  /**
   * Test if layer is has a title
   * @param layer - Layer to check
   * @returns True if layer is has a title
   */
  hasLayerTitle(layer: Layer): boolean {
    return getTitle(layer) !== undefined && getTitle(layer) !== '';
  }

  /**
   * Test if layers features are editable
   * @param layer - Layer to check
   * @returns True if layer has attribute 'editor' and in it
   * 'editable' property is set to true or missing
   */
  isLayerEditable(layer: Layer): boolean {
    if (getEditor(layer) === undefined) {
      return true;
    }
    const editorConfig = getEditor(layer);
    if (editorConfig.editable === undefined) {
      return true;
    }
    return editorConfig.editable;
  }

  /**
   * Get user friendly name of layer based primary on title
   * and secondary on name attributes.
   * Is used in query service and hover popup.
   * @param layer - Layer to get the name for
   */
  getLayerName(layer: Layer): string {
    if (
      layer === undefined ||
      (getShowInLayerManager(layer) !== undefined &&
        getShowInLayerManager(layer) === false)
    ) {
      return '';
    } else {
      const layerName = getTitle(layer) || getName(layer);
      return layerName;
    }
  }

  /**
   * Checks if layer has a VectorSource object, if layer is
   * not internal for hslayers, if it has title and is shown in layer
   * switcher
   * @param layer - Layer to check
   * @returns True if layer is drawable vector layer
   */
  isLayerDrawable(layer: Layer): boolean {
    return (
      this.HsUtilsService.instOf(layer, VectorLayer) &&
      layer.getVisible() &&
      this.isLayerInManager(layer) &&
      this.hasLayerTitle(layer) &&
      this.isLayerEditable(layer)
    );
  }

  /**
   * Checks if layer's source has its own source
   * @param layer - Layer to check
   * @returns True if layer is clustered, false otherwise
   */
  isLayerClustered(layer: Layer): boolean {
    return this.isLayerVectorLayer(layer) &&
      getCluster(layer) &&
      layer.getSource()?.getSource
      ? true
      : false;
  }

  translateTitle(title: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(
      'LAYERS',
      title
    );
  }

  /**
   * Test if layers source is loaded
   * @param layer - Selected layer descriptor
   * @returns True loaded / False not (fully) loaded
   */
  layerLoaded(layer: HsLayerDescriptor): boolean {
    return layer.loadProgress?.loaded;
  }

  /**
   * Test if layers source is validly loaded (!true for invalid)
   * @param layer - Selected layer descriptor
   * @returns True invalid, false valid source
   */
  layerInvalid(layer: HsLayerDescriptor): boolean {
    return layer.loadProgress?.error;
  }
}
