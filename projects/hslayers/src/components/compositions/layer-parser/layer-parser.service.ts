import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Attribution} from 'ol/control';
import {
  ImageArcGISRest,
  ImageStatic,
  ImageWMS,
  TileArcGISRest,
  TileWMS,
  XYZ,
} from 'ol/source';
import {Image as ImageLayer, Tile, Vector as VectorLayer} from 'ol/layer';
import {Injectable} from '@angular/core';

import SparqlJson from '../../../common/layers/hs.source.SparqlJson';
import {HsAddDataVectorService} from '../../data/vector/add-data-vector.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsVectorLayerOptions} from '../../data/vector/vector-layer-options.type';
import {HsWmtsGetCapabilitiesService} from '../../../common/wmts/get-capabilities.service';
import {tweakGeoserverUrl} from '../../save-map/layman-utils';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLayerParserService {
  constructor(
    public HsMapService: HsMapService,
    public HsAddDataVectorService: HsAddDataVectorService,
    public HsStylerService: HsStylerService,
    public HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService
  ) {}

  /**
   * @ngdoc method
   * @name hs.compositions.config_parsers.service#createWMTSLayer
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Tile layer
   * @description Parse definition object to create WMTS Ol.layer  (source = ol.source.WMTS)
   */
  createWMTSLayer(lyr_def): any {
    const wmts = new Tile({
      title: lyr_def.title,
      info_format: lyr_def.info_format,
      source: new WMTS({}),
    });

    // Get WMTS Capabilities and create WMTS source base on it
    this.HsWmtsGetCapabilitiesService.requestGetCapabilities(lyr_def.url).then(
      (res) => {
        try {
          //parse the XML response and create options object...
          const parser = new WMTSCapabilities();
          const result = parser.read(res);
          // ...create WMTS Capabilities based on the parsed options
          const options = optionsFromCapabilities(result, {
            layer: lyr_def.layer,
            matrixSet: lyr_def.matrixSet,
            format: lyr_def.format,
          });
          // WMTS source for raster tiles layer
          wmts.setSource(new WMTS(options));
          this.HsMapService.proxifyLayerLoader(wmts, true);
        } catch (error) {
          console.error(error);
          this.HsMapService.map.getLayers().remove(wmts);
        }
      }
    );

    wmts.setVisible(lyr_def.visibility);
    return wmts;
  }

  /**
   * @ngdoc method
   * @name hs.compositions.config_parsers.service#createWmsLayer
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create WMS Ol.layer  (source = ol.source.ImageWMS / ol.source.TileWMS)
   */
  createWmsLayer(lyr_def) {
    const source_class = lyr_def.singleTile ? ImageWMS : TileWMS;
    const layer_class = lyr_def.singleTile ? ImageLayer : Tile;
    const params = lyr_def.params;
    const legends = this.getLegends(lyr_def);
    delete params.REQUEST;
    //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
    const url = tweakGeoserverUrl(decodeURIComponent(lyr_def.url));
    const source = new source_class({
      url: url,
      attributions: lyr_def.attribution
        ? [
            new Attribution({
              html:
                '<a href="' +
                lyr_def.attribution.OnlineResource +
                '">' +
                lyr_def.attribution.Title +
                '</a>',
            }),
          ]
        : undefined,
      styles: lyr_def.metadata ? lyr_def.metadata.styles : undefined,
      params: params,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection,
      ratio: lyr_def.ratio,
    });
    const new_layer = new layer_class({
      title: lyr_def.title,
      from_composition: true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      minScale: lyr_def.minScale || Infinity,
      maxScale: lyr_def.maxScale || 0,
      show_in_manager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base,
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      saveState: true,
      path: lyr_def.path,
      opacity: lyr_def.opacity || 1,
      source,
      subLayers: lyr_def.subLayers,
    });

    new_layer.setVisible(lyr_def.visibility);
    this.HsMapService.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @ngdoc method
   * @name hs.compositions.config_parsers.service#createArcGISLayer
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create ArcGIS Ol.layer  (source = ol.source.ImageArcGISRest / ol.source.TileArcGISRest)
   */
  createArcGISLayer(lyr_def) {
    const source_class = lyr_def.singleTile ? ImageArcGISRest : TileArcGISRest;
    const layer_class = lyr_def.singleTile ? ImageLayer : Tile;
    const params = lyr_def.params;
    const legends = this.getLegends(lyr_def);
    if (params) {
      delete params.REQUEST;
    }
    //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
    const source = new source_class({
      url: decodeURIComponent(lyr_def.url),
      attributions: lyr_def.attribution
        ? [
            new Attribution({
              html:
                '<a href="' +
                lyr_def.attribution.OnlineResource +
                '">' +
                lyr_def.attribution.Title +
                '</a>',
            }),
          ]
        : undefined,
      params: params,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection,
      ratio: lyr_def.ratio,
    });
    const new_layer = new layer_class({
      title: lyr_def.title,
      from_composition: true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      minScale: lyr_def.minScale || Infinity,
      maxScale: lyr_def.maxScale || 0,
      show_in_manager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base,
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      saveState: true,
      path: lyr_def.path,
      opacity: lyr_def.opacity || 1,
      source,
    });

    new_layer.setVisible(lyr_def.visibility);
    //TODO Proxify
    //OlMap.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @ngdoc method
   * @name hs.compositions.config_parsers.service#createXYZLayer
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create XYZ Ol.layer
   */
  createXYZLayer(lyr_def) {
    const source_class = XYZ;
    const layer_class = Tile;
    const legends = this.getLegends(lyr_def);
    const source = new source_class({
      url: decodeURIComponent(lyr_def.url),
      attributions: lyr_def.attribution
        ? [
            new Attribution({
              html:
                '<a href="' +
                lyr_def.attribution.OnlineResource +
                '">' +
                lyr_def.attribution.Title +
                '</a>',
            }),
          ]
        : undefined,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection,
      wrapX: lyr_def.wrapX,
      //TODO Add the rest of parameters and describe in the composition schema
    });
    const new_layer = new layer_class({
      title: lyr_def.title,
      from_composition: true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      minScale: lyr_def.minScale || Infinity,
      maxScale: lyr_def.maxScale || 0,
      show_in_manager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base || lyr_def.url.indexOf('openstreetmap') > -1,
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      saveState: true,
      path: lyr_def.path,
      opacity: lyr_def.opacity || 1,
      source,
    });

    new_layer.setVisible(lyr_def.visibility);
    //TODO Proxify
    //OlMap.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @ngdoc method
   * @name hs.compositions.config_parsers.service#createStaticImageLayer
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create ImageStatic Ol.layer
   */
  createStaticImageLayer(lyr_def) {
    const source_class = ImageStatic;
    const layer_class = ImageLayer;
    const legends = this.getLegends(lyr_def);
    const source = new source_class({
      url: decodeURIComponent(lyr_def.url),
      attributions: lyr_def.attribution
        ? [
            new Attribution({
              html:
                '<a href="' +
                lyr_def.attribution.OnlineResource +
                '">' +
                lyr_def.attribution.Title +
                '</a>',
            }),
          ]
        : undefined,
      imageExtent: lyr_def.extent,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection,
      wrapX: lyr_def.wrapX,
      //TODO Add the rest of parameters and describe in the composition schema
    });
    const new_layer = new layer_class({
      title: lyr_def.title,
      from_composition: true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      minScale: lyr_def.minScale || Infinity,
      maxScale: lyr_def.maxScale || 0,
      show_in_manager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base,
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      saveState: true,
      path: lyr_def.path,
      opacity: lyr_def.opacity || 1,
      source,
    });

    new_layer.setVisible(lyr_def.visibility);
    return new_layer;
  }

  /**
   * @ngdoc method
   * @name hs.compositions.config_parsers.service#createSparqlLayer
   * @public
   * @param {object} lyr_def Layer definition object
   * @description  Parse definition object to create Sparql layer
   */
  createSparqlLayer(lyr_def) {
    const url = decodeURIComponent(lyr_def.protocol.url);
    const definition: any = {};
    definition.url = url;
    definition.format = 'hs.format.Sparql';

    let style = null;
    if (lyr_def.style) {
      style = this.HsStylerService.parseStyle(lyr_def.style);
    }

    const src = new SparqlJson({
      geom_attribute: '?geom',
      url: url,
      category: 'http://www.openvoc.eu/poi#categoryWaze',
      projection: 'EPSG:3857',
    });

    const lyr = new VectorLayer({
      from_composition: true,
      definition: definition,
      source: src,
      opacity: lyr_def.opacity || 1,
      style: style,
      title: lyr_def.title,
    });
    lyr.setVisible(lyr_def.visibility);
  }

  getLegends(lyr_def): string[] {
    if (lyr_def.legends) {
      return lyr_def.legends.map((legend) => decodeURIComponent(legend));
    }
    return [];
  }

  /**
   * @ngdoc method
   * @name hs.compositions.config_parsers.service#createVectorLayer
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {ol.layer.Vector|Function} Either valid vector layer or function for creation of other supported vector file types)
   * @description Parse definition object to create Vector layer (classic Ol.vector, KML, GeoJSON, WFS, Sparql)
   */
  createVectorLayer(lyr_def) {
    let format = '';
    if (lyr_def.protocol) {
      format = lyr_def.protocol.format;
      if (lyr_def.protocol.url !== undefined) {
        lyr_def.protocol.url = decodeURIComponent(lyr_def.protocol.url);
      }
    }
    const options: HsVectorLayerOptions = {
      opacity: lyr_def.opacity || 1,
      from_composition: true,
      path: lyr_def.path,
      visible: lyr_def.visibility,
    };
    let extractStyles = true;
    if (lyr_def.style) {
      options.style = this.HsStylerService.parseStyle(lyr_def.style);
      extractStyles = false;
    }
    const title = lyr_def.title || 'Layer';
    let layer;
    switch (format) {
      case 'ol.format.KML':
        layer = this.HsAddDataVectorService.createVectorLayer(
          'kml',
          lyr_def.protocol.url,
          lyr_def.name || title,
          title,
          lyr_def.abstract,
          lyr_def.projection?.toUpperCase(),
          Object.assign(options, {extractStyles})
        );
        break;
      case 'ol.format.GeoJSON':
        layer = this.HsAddDataVectorService.createVectorLayer(
          'geojson',
          lyr_def.protocol.url,
          lyr_def.name || title,
          title,
          lyr_def.abstract,
          lyr_def.projection?.toUpperCase(),
          options
        );
        break;
      case 'hs.format.WFS':
      case 'WFS':
        layer = this.HsAddDataVectorService.createVectorLayer(
          'wfs',
          lyr_def.protocol.url,
          lyr_def.name || title,
          title,
          lyr_def.abstract,
          lyr_def.projection?.toUpperCase(),
          options
        );
        break;
      case 'hs.format.Sparql':
        layer = this.createSparqlLayer(lyr_def);
        break;
      default:
        layer = this.HsAddDataVectorService.createVectorLayer(
          '',
          undefined,
          lyr_def.name || title,
          title,
          lyr_def.abstract,
          lyr_def.projection?.toUpperCase(),
          {
            opacity: lyr_def.opacity,
            visible: lyr_def.visibility,
            path: lyr_def.path,
            from_composition: lyr_def.from_composition,
            style: lyr_def.style,
            features: lyr_def.features,
          }
        );
    }
    layer.set('definition', lyr_def.protocol);
    return layer;
  }
}
