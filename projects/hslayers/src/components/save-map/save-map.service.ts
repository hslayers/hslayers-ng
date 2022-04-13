import {Injectable} from '@angular/core';

import VectorSource from 'ol/source/Vector';
import {Circle, Icon, RegularShape, Style} from 'ol/style';
import {
  Cluster,
  ImageArcGISRest,
  ImageStatic,
  ImageWMS,
  Source,
  TileArcGISRest,
  WMTS,
  XYZ,
} from 'ol/source';
import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {Layer} from 'ol/layer';

import {BoundingBoxObject} from './bounding-box-object.type';
import {HsConfig} from '../../config.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsShareThumbnailService} from '../permalink/share-thumbnail.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  getAttribution,
  getBase,
  getDefinition,
  getDimensions,
  getLegends,
  getMetadata,
  getName,
  getOrigLayers,
  getPath,
  getShowInLayerManager,
  getSld,
  getSubLayers,
  getSwipeSide,
  getTitle,
  getWfsUrl,
  getWorkspace,
} from '../../common/layer-extensions';
import {transformExtent} from 'ol/proj';

const LCLSTORAGE_EXPIRE = 5000;

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapService {
  public internalLayers: Layer<Source>[] = [];
  constructor(
    public hsConfig: HsConfig,
    public HsMapService: HsMapService,
    public HsUtilsService: HsUtilsService,
    public HsLayoutService: HsLayoutService,
    public HsLogService: HsLogService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsShareThumbnailService: HsShareThumbnailService
  ) {}

  /**
   * Create Json object which stores information about composition, user, map state and map layers (including layer data)
   * @param {Ol.map} map Selected map object
   * @param {object} compoData Composition general metadata
   * @param {object} userData Metadata about user
   * @param {object} statusData Metadata about permissions
   * @returns {object} JSON object with all required map composition metadata
   */
  map2json(map, compoData, userData, statusData, app: string) {
    const groups: any = {};
    for (const g of statusData.groups || []) {
      if (g.r || g.w) {
        groups[g.roleName] = (g.r ? 'r' : '') + (g.w ? 'w' : '');
      }
    }
    if (groups.guest == undefined) {
      groups.guest = 'r';
    }
    const bbox = this.getBboxFromObject(compoData.bbox);
    const json: any = {
      abstract: compoData.abstract,
      title: compoData.title,
      keywords: compoData.keywords,
      nativeExtent: transformExtent(
        bbox,
        'EPSG:4326',
        this.HsMapService.getCurrentProj(app)
      ),
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
      describedBy:
        'https://raw.githubusercontent.com/hslayers/map-compositions/2.0.0/schema.json',
      schema_version: '2.0.0',
      groups: groups,
    };

    // Map properties
    const currentProj = this.HsMapService.getCurrentProj(app);
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
    json.layers = this.layers2json(compoData.layers, app);
    json.current_base_layer = this.getCurrentBaseLayer(app);
    return json;
  }
  /**
   * Returns object about current selected base layer
   * @param {Map} map Selected map object
   * @returns {object} Returns object with current current selected base layers title as attribute
   */
  getCurrentBaseLayer(app: string) {
    let current_base_layer = null;
    for (const lyr of this.HsMapService.getLayersArray(app)) {
      if (
        (getShowInLayerManager(lyr) == undefined ||
          getShowInLayerManager(lyr) == true) &&
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
   * Get bounding box from object {east: value, south: value, west: value, north: value}
   * @param bbox - Bounding box
   * @returns Returns bounding box as number array
   */
  getBboxFromObject(bbox: number[] | BoundingBoxObject): number[] {
    if (bbox && !Array.isArray(bbox)) {
      return [
        parseFloat(bbox.east),
        parseFloat(bbox.south),
        parseFloat(bbox.west),
        parseFloat(bbox.north),
      ];
    } else {
      return bbox as number[];
    }
  }

  /**
   * Converts map layers into a JSON object. If $scope is defined, stores only layers checked in form
   * Uses layer2json().
   * @param {Array} layers All map layers
   * @returns {Array} JSON object representing the layers
   */
  layers2json(layers, app: string) {
    const json = [];
    layers.forEach((layer) => {
      const l = this.layer2json(layer, app);
      if (l) {
        json.push(l);
      }
    });
    return json;
  }

  /**
   * Converts map layer from Layer object to text in JSON notation.
   *
   * Syntactic sugar for layer2json() UNUSED?
   *
   * @param {object} layer Layer to be converted
   * @param {boolean} pretty Whether to use pretty notation
   * @returns {string} Text in JSON notation representing the layer
   */
  layer2string(layer, pretty, app: string) {
    const json = this.layer2json(layer, app);
    const text = JSON.stringify(json, pretty);
    return text;
  }

  /**
   * Convert layer style object into JSON object, partial function of layer2style
   * (saves Fill color, Stroke color/width, Image fill, stroke, radius, src and type)
   *
   * @param s Style to convert
   * @returns {object} Converted JSON object for style
   */
  serializeStyle(style: Style | Style[], app: string) {
    const s = Array.isArray(style) ? style[0] : style;
    const o: any = {};
    const ima: any = {};
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
      if (this.HsUtilsService.instOf(style_img, RegularShape)) {
        const regShape = style_img as RegularShape;
        if (regShape.getFill()) {
          ima.fill = regShape.getFill().getColor();
        }

        if (regShape.getStroke()) {
          ima.stroke = {
            color: regShape.getStroke().getColor(),
            width: regShape.getStroke().getWidth(),
          };
        }
        ima.radius = regShape.getRadius();
      }

      if (
        this.HsUtilsService.instOf(style_img, Icon) &&
        typeof (style_img as Icon).getSrc() === 'string' &&
        !(style_img as Icon).getSrc().startsWith('data:image')
      ) {
        ima.src = this.HsUtilsService.proxify(
          (style_img as Icon).getSrc(),
          app
        );
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
   *                            maxResolution, metadata,
   *                            abstract, opacity, singleTile, removable,
   *                            queryable, legend, projections,
   *                            wmsMinScale, wmsMaxScale
   *
   * The layer index is not covered, as we assume
   * that it is corresponding to the layers order.
   *
   * @param layer - Map layer that should be converted
   * @returns JSON object representing the layer
   */
  layer2json(layer: Layer<Source>, app: string): any {
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
    json.swipeSide = getSwipeSide(layer);
    json.opacity = layer.getOpacity();
    json.base = getBase(layer) ?? false;
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
      json.displayInLayerSwitcher = getShowInLayerManager(layer);
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
        json.extent = (src as ImageStatic).getImageExtent();
      }
      if (this.HsLayerUtilsService.isLayerWMS(layer)) {
        json.className = 'HSLayers.Layer.WMS';
        json.singleTile = this.HsUtilsService.instOf(src, ImageWMS);
        if (getLegends(layer)) {
          json.legends = [];
          const legends = getLegends(layer);
          if (Array.isArray(legends)) {
            json.legends = legends.map((l) => encodeURIComponent(l));
          }
          if (typeof legends == 'string') {
            json.legends = [legends];
          }
        }
        if (src.getProjection()) {
          json.projection = src.getProjection().getCode().toLowerCase();
        }
        json.params = this.HsLayerUtilsService.getLayerParams(layer);
        if (getOrigLayers(layer)) {
          json.params.LAYERS = getOrigLayers(layer);
        }
        json.subLayers = getSubLayers(layer);
        json.metadata.styles = src.get('styles');
      }
      json.url = encodeURIComponent(this.HsLayerUtilsService.getURL(layer));
      if (getAttribution(layer)) {
        json.attributions = getAttribution(layer);
      }

      if (this.HsUtilsService.instOf(src, WMTS)) {
        const wmts = src as WMTS;
        json.className = 'HSLayers.Layer.WMTS';
        json.matrixSet = wmts.getMatrixSet();
        json.layer = wmts.getLayer();
        json.format = wmts.getFormat();
        json.info_format = layer.get('info_format');
        json.url = wmts.getUrls()[0];
      }
    }

    // Vector
    if (this.HsUtilsService.instOf(layer, VectorLayer)) {
      let src = layer.getSource();
      if (this.HsLayerUtilsService.isLayerClustered(layer)) {
        src = (src as Cluster).getSource();
      }
      json.name = getName(layer);
      json.className = 'Vector';
      const definition = getDefinition(layer);
      if (definition && definition.url) {
        json.protocol = {
          url: encodeURIComponent(definition.url),
          format: definition.format,
        };
        json.workspace = getWorkspace(layer);
        delete json.features;
      } else {
        if (getWfsUrl(layer)) {
          json.protocol = {
            url: getWfsUrl(layer),
            format: 'hs.format.externalWFS',
          };
        } else {
          try {
            json.features = this.getFeaturesJson(
              (src as VectorSource<Geometry>).getFeatures(),
              app
            );
          } catch (ex) {
            //Do nothing
          }
        }
      }
      json.maxResolution = layer.getMaxResolution();
      json.minResolution = layer.getMinResolution();
      json.projection = 'epsg:4326';
      if (getSld(layer) != undefined) {
        json.style = getSld(layer);
      } else if (
        this.HsUtilsService.instOf(
          (layer as VectorLayer<VectorSource<Geometry>>).getStyle(),
          Style
        )
      ) {
        json.style = this.serializeStyle(
          (layer as VectorLayer<VectorSource<Geometry>>).getStyle() as Style,
          app
        );
      }
    }
    return json;
  }

  /**
   * Convert feature array to GeoJSON string
   *
   * @param features - Array of features
   * @returns GeoJSON
   */
  getFeaturesJson(features: Feature<Geometry>[], app: string): any {
    const f = new GeoJSON();
    const featureProjection = this.HsMapService.getCurrentProj(app).getCode();
    return f.writeFeaturesObject(features, {
      dataProjection: 'EPSG:4326',
      featureProjection,
    });
  }

  /**
   * Create thumbnail of map view and save it into selected element
   * @param {$element} $element Selected element
   * @param {object} localThis Context to be passed to postcompose event handler
   * @param {boolean} newRender Force new render?
   */
  generateThumbnail($element, localThis, app: string, newRender?) {
    if ($element === null) {
      return;
    }
    $element.setAttribute('crossOrigin', 'Anonymous');
    const map = this.HsMapService.getMap(app);
    map.once('postcompose', () =>
      this.HsShareThumbnailService.rendered($element, app, newRender)
    );
    if (newRender) {
      map.renderSync();
    } else {
      this.HsShareThumbnailService.rendered($element, app, newRender);
    }
  }

  save2storage(evt, app: string): void {
    const data = {
      expires: new Date().getTime() + LCLSTORAGE_EXPIRE,
      layers: this.HsMapService.getLayersArray(app)
        .filter(
          (lyr) =>
            !this.internalLayers.includes(lyr) &&
            (getShowInLayerManager(lyr) == undefined ||
              getShowInLayerManager(lyr) == true)
        )
        .map((lyr: Layer<Source>) => this.layer2json(lyr, app)),
    };
    //TODO: Set the item sooner, so it can be reloaded after accidental browser crash
    // but remove it if leaving the site for good
    localStorage.setItem('hs_layers', JSON.stringify(data));
  }
}
