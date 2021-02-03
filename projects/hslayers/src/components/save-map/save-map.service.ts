import {Injectable} from '@angular/core';

import {Circle, Icon, Style} from 'ol/style';
import {GeoJSON} from 'ol/format';
import {
  ImageArcGISRest,
  ImageStatic,
  ImageWMS,
  TileArcGISRest,
  TileWMS,
  XYZ,
  WMTS,
} from 'ol/source';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {Map} from 'ol';

import {HsConfig} from '../../config.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {Layer} from 'ol/layer';
import {
  getBase,
  getDefinition,
  getDimensions,
  getMetadata,
  getName,
  getPath,
  getTitle,
} from '../../common/layer-extensions';
@Injectable({
  providedIn: 'root',
})
export class HsSaveMapService {
  constructor(
    public hsConfig: HsConfig,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLayoutService: HsLayoutService,
    public HsLogService: HsLogService,
    public HsLayerUtilsService: HsLayerUtilsService
  ) {
    if (hsConfig.saveMapStateOnReload === undefined) {
      hsConfig.saveMapStateOnReload = true;
    }
    if (hsConfig.saveMapStateOnReload) {
      window.addEventListener('beforeunload', (e) => this.save2storage(e));
    }
  }

  /**
   * Create Json object which stores information about composition, user, map state and map layers (including layer data)
   * @param {Ol.map} map - Selected map object
   * @param {object} compoData - Composition general metadata
   * @param {object} userData - Metadata about user
   * @param {object} statusData - Metadata about permissions
   * @returns {object} JSON object with all required map composition metadata
   */
  map2json(map, compoData, userData, statusData) {
    const groups: any = {};
    for (const g of statusData.groups || []) {
      if (g.r || g.w) {
        groups[g.roleName] = (g.r ? 'r' : '') + (g.w ? 'w' : '');
      }
    }
    if (groups.guest == undefined) {
      groups.guest = 'r';
    }
    let bbox = compoData.bbox;
    if (compoData.bbox && !Array.isArray(compoData.bbox)) {
      bbox = [
        compoData.bbox.east,
        compoData.bbox.south,
        compoData.bbox.west,
        compoData.bbox.north,
      ];
    }
    const json: any = {
      abstract: compoData.abstract,
      title: compoData.title,
      keywords: compoData.keywords,
      extent: bbox,
      user: {
        address: userData.address,
        city: userData.city,
        country: userData.country,
        email: userData.email || 'none@none',
        name: userData.name,
        organization: userData.organization,
        phone: userData.phone,
        position: userData.position,
        postalcode: userData.postalcode,
        state: userData.state,
      },
      groups: groups,
    };

    // Map properties
    const currentProj = this.HsMapService.getCurrentProj();
    json.scale = currentProj.getMetersPerUnit();
    json.projection = currentProj.getCode().toLowerCase();
    const center = map.getView().getCenter();
    if (center) {
      json.center = [center[0], center[1]];
    }
    json.units = currentProj.getUnits();

    if (map.maxExtent) {
      json.maxExtent = {};
      json.maxExtent.left = map.maxExtent.left;
      json.maxExtent.bottom = map.maxExtent.bottom;
      json.maxExtent.right = map.maxExtent.right;
      json.maxExtent.top = map.maxExtent.top;
    }

    //json.minResolution = map.minResolution;
    //json.maxResolution = map.maxResolution;
    //json.numZoomLevels = map.numZoomLevels;

    //json.resolutions = map.resolutions;
    //json.scales = map.scales;
    //json.sphericalMercator = map.sphericalMercator;

    // Layers properties
    let layers = map.getLayers().getArray();
    layers = layers.filter(
      (l) => l.get('show_in_manager') == undefined || l.get('show_in_manager')
    );
    json.layers = this.layers2json(layers, compoData.layers);
    json.current_base_layer = this.getCurrentBaseLayer(map);
    return json;
  }

  /**
   * Returns object about current selected base layer
   *
   * @memberof HsSaveMapService
   * @function getCurrentBaseLayer
   * @param {Map} map Selected map object
   * @returns {object} Returns object with current current selected base layers title as attribute
   */
  getCurrentBaseLayer(map: Map) {
    let current_base_layer = null;
    for (const lyr of map.getLayers().getArray()) {
      if (
        (lyr.get('show_in_manager') == undefined ||
          lyr.get('show_in_manager') == true) &&
        getBase(lyr) == true &&
        lyr.getVisible()
      ) {
        current_base_layer = {
          title: getTitle(lyr),
        };
      }
    }
    return current_base_layer;
  }

  /**
   * Converts map layers into a JSON object. If $scope is defined, stores only layers checked in form
   * Uses layer2json().
   *
   * @memberof HsSaveMapService
   * @function layer2json
   * @param {Array} layers All map layers
   * @param {Array} tickedLayers List of layers and if they have been ticked
   * @returns {Array} JSON object representing the layers
   */
  layers2json(layers, tickedLayers?) {
    const json = [];
    layers.forEach((lyr) => {
      if (tickedLayers) {
        //From form
        for (const list_item of tickedLayers) {
          if (list_item.layer == lyr && list_item.checked) {
            const l = this.layer2json(lyr);
            if (l) {
              json.push(l);
            }
          }
        }
      } else {
        //From unloading
        const l = this.layer2json(lyr);
        if (l) {
          json.push(l);
        }
      }
    });

    return json;
  }

  /**
   * Converts map layer from Layer object to text in JSON notation.
   *
   * Syntactic sugar for layer2json() UNUSED?
   *
   * @memberof HsSaveMapService
   * @function layer2string
   * @param {object} layer Layer to be converted
   * @param {boolean} pretty Whether to use pretty notation
   * @returns {string} Text in JSON notation representing the layer
   */
  layer2string(layer, pretty) {
    const json = this.layer2json(layer);
    const text = JSON.stringify(json, pretty);
    return text;
  }

  /**
   * Convert layer style object into JSON object, partial function of layer2style
   * (saves Fill color, Stroke color/width, Image fill, stroke, radius, src and type)
   *
   * @param s - Style to convert
   * @returns {object} Converted JSON object for style
   */
  serializeStyle(s: Style) {
    const o: any = {};
    if (s.getFill() && s.getFill() !== null) {
      o.fill = s.getFill().getColor();
    }
    if (s.getStroke() && s.getStroke() !== null) {
      o.stroke = {
        color: s.getStroke().getColor(),
        width: s.getStroke().getWidth(),
      };
    }
    if (s.getImage() && s.getImage() !== null) {
      const style_img = s.getImage();
      const ima: any = {};
      if (
        style_img.getFill &&
        style_img.getFill() &&
        style_img.getFill() !== null
      ) {
        ima.fill = style_img.getFill().getColor();
      }

      if (
        style_img.getStroke &&
        style_img.getStroke() &&
        style_img.getStroke() !== null
      ) {
        ima.stroke = {
          color: style_img.getStroke().getColor(),
          width: style_img.getStroke().getWidth(),
        };
      }

      if (style_img.getRadius) {
        ima.radius = style_img.getRadius();
      }
      if (
        this.HsUtilsService.isFunction(style_img.getSrc) &&
        typeof style_img.getSrc() === 'string' &&
        !style_img.getSrc().startsWith('data:image')
      ) {
        ima.src = this.HsUtilsService.proxify(style_img.getSrc());
      } else if (
        this.HsUtilsService.isFunction(style_img.getImage) &&
        style_img.getImage() !== null
      ) {
        if (style_img.getImage().src) {
          ima.src = style_img.getImage().src;
        }
      }

      if (this.HsUtilsService.instOf(style_img, Circle)) {
        ima.type = 'circle';
      }

      if (this.HsUtilsService.instOf(style_img, Icon)) {
        ima.type = 'icon';
      }

      o.image = ima;
    }
    return o;
  }

  /**
   * Converts map layer into a JSON object (only for ol.layer.Layer)
   * Layer properties covered:  (CLASS_NAME), name, url, params,
   *                            group, displayInLayerSwitcher, *visibility, *opacity
   *                            attribution, transitionEffect,
   *                             isBaseLayer, minResolution,
   *                            maxResolution, minScale, maxScale, metadata,
   *                            abstract, opacity, singleTile, removable,
   *                            queryable, legend, projections,
   *                            wmsMinScale, wmsMaxScale
   *
   * The layer index is not covered, as we assume
   * that it is corresponding to the layers order.
   *
   * @memberof HsSaveMapService
   * @function layer2json
   * @param {object} layer Map layer that should be converted
   * @returns {object} JSON object representing the layer
   */
  layer2json(layer: Layer): any {
    const json: any = {
      metadata: getMetadata(layer) || {},
    };

    /*
          Commented out because we cant reliably use instanceof.
          utils.instOf is also not possible, because Layer is a base type

          if (!layer instanceof Layer) {
              return;
          }
          */

    // Common stuff

    // type
    //json.className = layer.CLASS_NAME;
    //json.origClassName = layer.CLASS_NAME; // the original type

    // options
    json.visibility = layer.getVisible();
    json.opacity = layer.getOpacity();
    json.base = getBase(layer);
    json.title = getTitle(layer);
    if (getTitle(layer) == undefined) {
      this.HsLogService.warn('Layer title undefined', layer);
    }
    //json.index = layer.map.getLayerIndex(layer);
    json.path = getPath(layer);

    if (layer.getExtent()) {
      const ex = layer.getExtent();
      json.maxExtent = {
        left: ex[0],
        bottom: ex[3],
        right: ex[2],
        top: ex[1],
      };
    }

    // HTTPRequest
    if (
      this.HsUtilsService.instOf(layer, Tile) ||
      this.HsUtilsService.instOf(layer, ImageLayer)
    ) {
      const src = layer.getSource();
      if (layer.getMaxResolution() !== null) {
        json.maxResolution = layer.getMaxResolution();
      }
      if (layer.getMinResolution() !== null) {
        json.minResolution = layer.getMinResolution();
      }
      if (layer.get('minScale') !== null) {
        json.wmsMinScale = layer.get('minScale');
      }
      if (layer.get('maxScale') !== null) {
        json.wmsMaxScale = layer.get('maxScale');
      }
      json.displayInLayerSwitcher = layer.get('show_in_manager');
      if (getDimensions(layer)) {
        json.dimensions = getDimensions(layer);
      }
      if (this.HsUtilsService.instOf(src, XYZ)) {
        json.className = 'XYZ';
      }
      if (
        this.HsUtilsService.instOf(src, ImageArcGISRest) ||
        this.HsUtilsService.instOf(src, TileArcGISRest)
      ) {
        json.className = 'ArcGISRest';
        json.singleTile = this.HsUtilsService.instOf(src, ImageArcGISRest);
      }
      if (this.HsUtilsService.instOf(src, ImageStatic)) {
        json.className = 'StaticImage';
        json.extent = src.getImageExtent();
      }
      if (
        this.HsUtilsService.instOf(src, ImageWMS) ||
        this.HsUtilsService.instOf(src, TileWMS)
      ) {
        json.className = 'HSLayers.Layer.WMS';
        json.singleTile = this.HsUtilsService.instOf(src, ImageWMS);
        if (layer.get('legends')) {
          json.legends = [];
          const legends = layer.get('legends');
          for (let i = 0; i < legends.length; i++) {
            json.legends.push(encodeURIComponent(legends[i]));
          }
        }
        if (src.getProjection()) {
          json.projection = src.getProjection().getCode().toLowerCase();
        }
        json.params = src.getParams();
        json.ratio = src.get('ratio') || src.ratio_;
        json.subLayers = layer.get('subLayers');
        json.metadata.styles = src.get('styles');
      }
      if (src.getUrl) {
        json.url = encodeURIComponent(src.getUrl());
      }
      if (src.getUrls) {
        json.url = encodeURIComponent(src.getUrls()[0]);
      }
      if (src.attributions_) {
        json.attributions = encodeURIComponent(src.attributions_);
      }

      if (this.HsUtilsService.instOf(src, WMTS)) {
        json.className = 'HSLayers.Layer.WMTS';
        json.matrixSet = src.getMatrixSet();
        json.layer = src.getLayer();
        json.format = src.getFormat();
        json.info_format = layer.get('info_format');
        json.url = src.getUrls()[0];
      }
    }

    // Vector
    if (this.HsUtilsService.instOf(layer, VectorLayer)) {
      let src = layer.getSource();
      if (this.HsLayerUtilsService.isLayerClustered(layer)) {
        src = src.getSource();
      }
      json.name = getName(layer);
      json.className = 'Vector';
      const definition = getDefinition(layer);
      if (definition && definition.url) {
        json.protocol = {
          url: encodeURIComponent(definition.url),
          format: definition.format,
        };
        delete json.features;
      } else {
        try {
          json.features = this.serializeFeatures(src.getFeatures());
        } catch (ex) {
          //Do nothing
        }
      }
      json.maxResolution = layer.getMaxResolution();
      json.minResolution = layer.getMinResolution();
      json.projection = 'epsg:4326';
      if (this.HsUtilsService.instOf(layer.getStyle(), Style)) {
        json.style = this.serializeStyle(layer.getStyle());
      }
    }
    return json;
  }

  /**
   * Convert feature array to GeoJSON string
   *
   * @memberof HsSaveMapService
   * @function serializeFeatures
   * @param {Array} features Array of features
   * @returns {string} GeoJSON string
   */
  serializeFeatures(features) {
    const f = new GeoJSON();
    return f.writeFeatures(features, {
      dataProjection: 'EPSG:4326',
      featureProjection: this.HsMapService.map
        .getView()
        .getProjection()
        .getCode(),
    });
  }

  /**
   * Create thumbnail of map view and save it into selected element
   *
   * @memberof HsSaveMapService
   * @function generateThumbnail
   * @param {$element} $element Selected element
   * @param {object} localThis Context to be passed to postcompose event handler
   * @param {boolean} newRender Force new render?
   */
  generateThumbnail($element, localThis, newRender?) {
    /**
     *
     */
    function rendered() {
      const canvas = this.HsMapService.getCanvas();
      const canvas2 = document.createElement('canvas');
      const width = 256,
        height = 256;
      canvas2.style.width = width + 'px';
      canvas2.style.height = height + 'px';
      canvas2.width = width;
      canvas2.height = height;
      const ctx2 = canvas2.getContext('2d');
      ctx2.drawImage(
        canvas,
        canvas.width / 2 - height / 2,
        canvas.height / 2 - width / 2,
        width,
        height,
        0,
        0,
        width,
        height
      );
      try {
        $element.setAttribute('src', canvas2.toDataURL('image/png'));
        this.thumbnail = canvas2.toDataURL('image/jpeg', 0.8);
      } catch (e) {
        this.$log.warn(e);
        $element.setAttribute(
          'src',
          this.HsUtilsService.getAssetsPath() + 'img/notAvailable.png'
        );
      }
      $element.style.width = width + 'px';
      $element.style.height = height + 'px';
    }
    if (
      this.HsLayoutService.mainpanel == 'save-map' ||
      this.HsLayoutService.mainpanel == 'permalink' ||
      this.HsLayoutService.mainpanel == 'statusCreator'
    ) {
      if ($element === null) {
        return;
      }
      $element.setAttribute('crossOrigin', 'Anonymous');

      this.HsMapService.map.once('postcompose', rendered, localThis);
      if (newRender) {
        this.HsMapService.map.renderSync();
      } else {
        rendered();
      }
    }
  }

  save2storage(evt): void {
    const data = {
      layers: [],
    };
    const layers = [];
    this.HsMapService.map.getLayers().forEach((layer) => {
      if (layer.get('saveState')) {
        const lyr = this.layer2json(layer);
        layers.push(lyr);
      }
    });
    data.layers = layers;
    //TODO: Set the item sooner, so it can be reloaded after accidental browser crash
    // but remove it if leaving the site for good
    localStorage.setItem('hs_layers', JSON.stringify(data));
  }
}
