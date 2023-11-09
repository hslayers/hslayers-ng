import {Injectable} from '@angular/core';
import {SerializedStyle} from './types/serialized-style.type';

import Map from 'ol/Map';
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
import {GeoJSONFeatureCollection} from 'ol/format/GeoJSON';
import {Geometry} from 'ol/geom';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {Layer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {transformExtent} from 'ol/proj';

import {BoundingBoxObject} from './types/bounding-box-object.type';
import {CompoData} from './types/compo-data.type';
import {
  CurrentBaseLayer,
  MapComposition,
  compositionVersion,
} from './types/map-composition.type';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsShareThumbnailService} from '../permalink/share-thumbnail.service';
import {HsUtilsService} from '../utils/utils.service';
import {HslayersLayerJSON, LayerJSON} from './types/layer-json.type';
import {SerializedImage} from './types/serialized-image.type';
import {StatusData} from './types/status-data.type';
import {UserData} from './types/user-data.type';
import {
  getAttribution,
  getBase,
  getDefinition,
  getDimensions,
  getGreyscale,
  getLegends,
  getMetadata,
  getName,
  getOrigLayers,
  getPath,
  getQml,
  getShowInLayerManager,
  getSld,
  getSubLayers,
  getSwipeSide,
  getTitle,
  getWfsUrl,
  getWorkspace,
} from '../../common/layer-extensions';

const LOCAL_STORAGE_EXPIRE = 5000;

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapService {
  public internalLayers: Layer<Source>[] = [];
  constructor(
    private hsMapService: HsMapService,
    private hsUtilsService: HsUtilsService,
    private hsLogService: HsLogService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsShareThumbnailService: HsShareThumbnailService,
  ) {}

  /**
   * Create JSON object, which stores information about composition, user, map state and map layers (including layer data)
   * @param map - Selected OL map object
   * @param compoData - Composition general metadata
   * @param userData - Metadata about user, organisation and point of contact
   * @param statusData - Metadata about permissions
   * @returns - JSON object with all required map composition's metadata
   */
  map2json(
    map: Map,
    compoData: CompoData,
    userData: UserData,
    statusData: StatusData,
  ): MapComposition {
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
    const json: MapComposition = {
      abstract: compoData.abstract,
      title: compoData.name,
      keywords: compoData.keywords,
      nativeExtent: transformExtent(
        bbox,
        'EPSG:4326',
        this.hsMapService.getCurrentProj(),
      ),
      extent: bbox,
      user: userData.user,
      contact: userData.contact,
      organization: userData.organization,
      describedBy: `https://raw.githubusercontent.com/hslayers/map-compositions/${compositionVersion}/schema.json`,
      schema_version: compositionVersion,
    };

    // Map properties
    const currentProj = this.hsMapService.getCurrentProj();
    json.scale = currentProj.getMetersPerUnit();
    json.projection = currentProj.getCode().toLowerCase();
    const center = map.getView().getCenter();
    if (center) {
      json.center = [center[0], center[1]];
    }
    json.units = currentProj.getUnits();

    //json.minResolution = map.minResolution;
    //json.maxResolution = map.maxResolution;
    //json.numZoomLevels = map.numZoomLevels;

    //json.resolutions = map.resolutions;
    //json.scales = map.scales;

    // Layers properties
    json.layers = this.layers2json(compoData.layers);
    json.current_base_layer = this.getCurrentBaseLayer();
    return json;
  }

  /**
   * Get currently selected base layer from the OL map
   * @returns Object with currently selected base layer's title as attribute
   */
  getCurrentBaseLayer(): CurrentBaseLayer {
    let current_base_layer = null;
    for (const lyr of this.hsMapService.getLayersArray()) {
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
   * Get bounding box from object \{east: value, south: value, west: value, north: value\}
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
   * Convert map layers into a JSON object
   * Uses layer2json().
   * @param layers - All map layers
   * @returns JSON object representing the layers
   */
  layers2json(layers: Layer[]): LayerJSON[] {
    const json: LayerJSON[] = [];
    layers.forEach((layer) => {
      const l = this.layer2json(layer);
      if (l) {
        json.unshift(l);
      }
    });
    return json;
  }

  /**
   * Convert layer's style object into JSON object, partial function of layer2style
   * (saves Fill color, Stroke color/width, Image fill, stroke, radius, src and type)
   * @deprecated Parse style to old custom JSON, should not be used and will be removed. Use SLD or QML instead
   * @param style - Style to convert
   * @returns Converted JSON object replacing OL style
   */
  serializeStyle(style: Style | Style[]): SerializedStyle {
    const s = Array.isArray(style) ? style[0] : style;
    const o: SerializedStyle = {};
    const ima: SerializedImage = {};
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
      if (this.hsUtilsService.instOf(style_img, RegularShape)) {
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
        this.hsUtilsService.instOf(style_img, Icon) &&
        typeof (style_img as Icon).getSrc() === 'string' &&
        !(style_img as Icon).getSrc().startsWith('data:image')
      ) {
        ima.src = this.hsUtilsService.proxify((style_img as Icon).getSrc());
      }

      if (this.hsUtilsService.instOf(style_img, Circle)) {
        ima.type = 'circle';
      }

      if (this.hsUtilsService.instOf(style_img, Icon)) {
        ima.type = 'icon';
      }

      o.image = ima;
    }
    return o;
  }

  /**
   * Convert map layer into a JSON object (only for ol.layer.Layer)
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
  layer2json(layer: Layer<Source>): HslayersLayerJSON {
    const json: HslayersLayerJSON = {
      metadata: getMetadata(layer) || {},
    };

    // Common stuff
    // options
    json.visibility = layer.getVisible();
    json.swipeSide = getSwipeSide(layer);
    json.opacity = layer.getOpacity();
    json.base = getBase(layer) ?? false;
    if (json.base) {
      json.greyscale = getGreyscale(layer);
    }
    json.title = getTitle(layer);
    if (getTitle(layer) == undefined) {
      this.hsLogService.warn('Layer title undefined', layer);
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
      this.hsUtilsService.instOf(layer, Tile) ||
      this.hsUtilsService.instOf(layer, ImageLayer)
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
      if (this.hsUtilsService.instOf(src, XYZ)) {
        json.className = this.hsLayerUtilsService
          .getURL(layer)
          .includes('/rest/services')
          ? 'ArcGISRest'
          : 'XYZ';
      }
      if (
        this.hsUtilsService.instOf(src, ImageArcGISRest) ||
        this.hsUtilsService.instOf(src, TileArcGISRest)
      ) {
        json.className = 'ArcGISRest';
        json.singleTile = this.hsUtilsService.instOf(src, ImageArcGISRest);
      }
      if (this.hsUtilsService.instOf(src, ImageStatic)) {
        json.className = 'StaticImage';
        json.extent = (src as ImageStatic).getImageExtent();
      }
      if (this.hsLayerUtilsService.isLayerWMS(layer)) {
        json.className = 'WMS';
        json.singleTile = this.hsUtilsService.instOf(src, ImageWMS);
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
        json.params = this.hsLayerUtilsService.getLayerParams(layer);
        if (getOrigLayers(layer)) {
          json.params.LAYERS = getOrigLayers(layer);
        }
        json.subLayers = getSubLayers(layer);
        json.metadata.styles = src.get('styles');
      }
      let url = this.hsLayerUtilsService.getURL(layer);
      url =
        json.className === 'ArcGISRest'
          ? url.replace('/tile/{z}/{y}/{x}', '')
          : url;
      json.url = url;
      if (getAttribution(layer)) {
        json.attributions = getAttribution(layer);
      }

      if (this.hsUtilsService.instOf(src, WMTS)) {
        const wmts = src as WMTS;
        json.className = 'WMTS';
        json.matrixSet = wmts.getMatrixSet();
        json.layer = wmts.getLayer();
        json.format = wmts.getFormat();
        json.info_format = layer.get('info_format');
        json.url = wmts.getUrls()[0];
      }
    }

    // Vector
    if (this.hsUtilsService.instOf(layer, VectorLayer)) {
      let src = layer.getSource();
      if (this.hsLayerUtilsService.isLayerClustered(layer)) {
        src = (src as Cluster).getSource();
      }
      json.name = getName(layer);
      json.className = 'Vector';
      const definition = getDefinition(layer);
      if (definition && definition.url) {
        json.workspace = getWorkspace(layer);
        json.protocol = {
          url: definition.url.includes(`/geoserver/${json.workspace}/`)
            ? definition.url
            : `${definition.url}/geoserver/${json.workspace}/wfs`,
          format: definition.format,
        };
        delete json.features;
      } else {
        if (getWfsUrl(layer)) {
          json.protocol = {
            url: getWfsUrl(layer),
            format: 'externalWFS',
          };
        } else {
          try {
            json.features = this.getFeaturesJson(
              (src as VectorSource<Geometry>).getFeatures(),
            );
          } catch (ex) {
            //Do nothing
          }
        }
      }
      json.maxResolution = layer.getMaxResolution();
      json.minResolution = layer.getMinResolution();
      json.projection = this.hsMapService.getCurrentProj().getCode();
      if (getSld(layer) != undefined) {
        json.style = getSld(layer);
      } else if (getQml(layer) != undefined) {
        json.style = getQml(layer);
      } else {
        this.hsLogService.warn(
          `Vector layer ${layer.get('title')} is missing style definition`,
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
  getFeaturesJson(features: Feature<Geometry>[]): GeoJSONFeatureCollection {
    const f = new GeoJSON();
    const featureProjection = this.hsMapService.getCurrentProj().getCode();
    return f.writeFeaturesObject(features, {
      dataProjection: 'EPSG:4326',
      featureProjection,
    });
  }

  /**
   * Create thumbnail of the map view and save it into selected element
   * @param $element - Selected element
   * @param newRender - Force new render
   */
  generateThumbnail($element: Element, newRender?): void {
    if ($element === null) {
      return;
    }
    $element.setAttribute('crossOrigin', 'Anonymous');
    const map = this.hsMapService.getMap();
    map.once('postcompose', () =>
      this.hsShareThumbnailService.rendered($element, newRender),
    );
    if (newRender) {
      map.renderSync();
    } else {
      this.hsShareThumbnailService.rendered($element, newRender);
    }
  }

  /**
   * Save map layers to browsers' local storage
   */
  save2storage(): void {
    const data = {
      expires: new Date().getTime() + LOCAL_STORAGE_EXPIRE,
      layers: this.hsMapService
        .getLayersArray()
        .filter(
          (lyr) =>
            !this.internalLayers.includes(lyr) &&
            (getShowInLayerManager(lyr) == undefined ||
              getShowInLayerManager(lyr) == true),
        )
        .map((lyr: Layer<Source>) => this.layer2json(lyr)),
    };
    //TODO: Set the item sooner, so it can be reloaded after accidental browser crash
    // but remove it if leaving the site for good
    localStorage.setItem('hs_layers', JSON.stringify(data));
  }
}
