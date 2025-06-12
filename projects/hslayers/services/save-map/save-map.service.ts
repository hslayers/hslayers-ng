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
  Vector as VectorSource,
} from 'ol/source';
import {Feature, Map} from 'ol';
import {EsriJSON, GeoJSON} from 'ol/format';
import {GeoJSONFeatureCollection} from 'ol/format/GeoJSON';
import {Geometry} from 'ol/geom';
import {Image as ImageLayer, Tile, Layer} from 'ol/layer';
import {Injectable} from '@angular/core';
import {transformExtent} from 'ol/proj';

import {
  COMPOSITION_VERSION,
  CurrentBaseLayer,
  HslayersLayerJSON,
  SerializedStyle,
  CompoData,
  LayerJSON,
  MapComposition,
  SerializedImage,
  UserData,
} from 'hslayers-ng/types';
import {
  getLayerParams,
  getURL,
  HsProxyService,
  instOf,
  isLayerClustered,
  isLayerVectorLayer,
  isLayerWMS,
  normalizeSldComparisonOperators,
  getBboxFromObject,
} from 'hslayers-ng/services/utils';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsShareThumbnailService} from 'hslayers-ng/services/share';
import {
  getAttribution,
  getBase,
  getDefinition,
  getDimensions,
  getGreyscale,
  getLaymanLayerDescriptor,
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
} from 'hslayers-ng/common/extensions';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {FeatureUrlFunction} from 'ol/featureloader';

const LOCAL_STORAGE_EXPIRE = 5000;

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapService {
  public internalLayers: Layer<Source>[] = [];
  constructor(
    private hsMapService: HsMapService,
    private hsLogService: HsLogService,
    private hsShareThumbnailService: HsShareThumbnailService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsProxyService: HsProxyService,
  ) {}

  /**
   * Create JSON object, which stores information about composition, user, map state and map layers (including layer data)
   * @param map - Selected OL map object
   * @param compoData - Composition general metadata
   * @param userData - Metadata about user, organisation and point of contact
   * @returns - JSON object with all required map composition's metadata
   */
  map2json(map: Map, compoData: CompoData, userData: UserData): MapComposition {
    const bbox = getBboxFromObject(compoData.bbox);
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
      describedBy: `https://raw.githubusercontent.com/hslayers/map-compositions/${COMPOSITION_VERSION}/schema.json`,
      schema_version: COMPOSITION_VERSION,
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
      if (instOf(style_img, RegularShape)) {
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
        instOf(style_img, Icon) &&
        typeof (style_img as Icon).getSrc() === 'string' &&
        !(style_img as Icon).getSrc().startsWith('data:image')
      ) {
        ima.src = this.hsProxyService.proxify((style_img as Icon).getSrc());
      }

      if (instOf(style_img, Circle)) {
        ima.type = 'circle';
      }

      if (instOf(style_img, Icon)) {
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
    if (instOf(layer, Tile) || instOf(layer, ImageLayer)) {
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
      if (instOf(src, XYZ)) {
        json.className = getURL(layer).includes('/rest/services')
          ? 'ArcGISRest'
          : 'XYZ';
      }
      if (instOf(src, ImageArcGISRest) || instOf(src, TileArcGISRest)) {
        json.className = 'ArcGISRest';
        json.singleTile = instOf(src, ImageArcGISRest);
        if (getSubLayers(layer)) {
          json.subLayers = getSubLayers(layer);
        }
      }
      if (instOf(src, ImageStatic)) {
        json.className = 'StaticImage';
        json.extent = (src as ImageStatic).getImageExtent();
      }
      if (isLayerWMS(layer)) {
        json.className = 'WMS';
        json.singleTile = instOf(src, ImageWMS);
        const legends = getLegends(layer);
        if (legends) {
          // Convert legends to array if it's a string; if it's empty string, make it []
          const normalized = Array.isArray(legends)
            ? legends
            : typeof legends == 'string' && legends !== ''
              ? [legends]
              : [];

          // Finally, remove any empty strings
          json.legends = normalized.filter((l) => l !== '');
        }
        if (src.getProjection()) {
          json.projection = src.getProjection().getCode().toLowerCase();
        }
        json.params = getLayerParams(layer);
        if (getOrigLayers(layer)) {
          json.params.LAYERS = getOrigLayers(layer);
        }
        json.subLayers = getSubLayers(layer);
        json.metadata.styles = src.get('styles');
      }
      let url = getURL(layer);
      url =
        json.className === 'ArcGISRest'
          ? url.replace('/tile/{z}/{y}/{x}', '')
          : url;
      json.url = url;
      if (getAttribution(layer)) {
        json.attributions = getAttribution(layer);
      }

      if (instOf(src, WMTS)) {
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
    if (isLayerVectorLayer(layer)) {
      let src = layer.getSource() as VectorSource;

      if (isLayerClustered(layer)) {
        src = (src as Cluster<Feature>).getSource();
      }
      const layerDescriptor = getLaymanLayerDescriptor(layer);
      if (layerDescriptor) {
        json.name = layerDescriptor.wfs.name;
      } else {
        json.name = getName(layer);
      }
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
        } else if (src.getFormat() instanceof EsriJSON) {
          /**
           * ArcGIS Rest feature service
           */
          json.className = 'ArcGISRest';
          json.singleTile = false;
          const urlFunc = src.getUrl() as FeatureUrlFunction;
          const serviceUrl = urlFunc(undefined, undefined, undefined);
          json.url = serviceUrl.split('FeatureServer')[0] + 'FeatureServer';
          /**
           * Layer that will be selected to be added
           */
          json.subLayers = this.extractLayerIdFromUrl(serviceUrl)?.toString();
        } else {
          try {
            json.features = this.getFeaturesJson(
              (src as VectorSource).getFeatures(),
            );
          } catch (ex) {
            //Do nothing
          }
        }
      }
      json.maxResolution = layer.getMaxResolution();
      json.minResolution = layer.getMinResolution();
      json.projection = this.hsMapService.getCurrentProj().getCode();

      if (json.protocol?.format == 'WFS') {
        /**
         * Do not store style directly in composition for Layman vector layers
         */
        json.style =
          this.hsCommonLaymanService.layman().url +
          '/rest/workspaces/' +
          json.workspace +
          '/layers/' +
          //Layer name expected here not uuid that's why not json.name
          getName(layer) +
          '/style';
      } else {
        if (getSld(layer) != undefined) {
          json.style = normalizeSldComparisonOperators(getSld(layer));
        } else if (getQml(layer) != undefined) {
          json.style = getQml(layer);
        } else {
          this.hsLogService.warn(
            `Vector layer ${layer.get('title')} is missing style definition`,
          );
        }
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

  /**
   * Extract layer ID from FeatureServer URL
   * @param url - FeatureServer URL (e.g., .../FeatureServer/0/query)
   * @returns Layer ID number or null if not found
   */
  private extractLayerIdFromUrl(url: string): number | null {
    const match = url.match(/FeatureServer\/(\d+)(?:\/|$)/i);
    return match ? parseInt(match[1], 10) : null;
  }
}
