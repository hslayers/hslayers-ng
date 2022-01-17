import {Injectable} from '@angular/core';

import ImageSource from 'ol/source/Image';
import TileSource from 'ol/source/Tile';
import VectorSource from 'ol/source/Vector';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {
  ImageArcGISRest,
  ImageStatic,
  ImageWMS,
  Source,
  TileArcGISRest,
  TileWMS,
  XYZ,
} from 'ol/source';
import {
  Image as ImageLayer,
  Layer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
import {Options as ImageOptions} from 'ol/layer/BaseImage';
import {Options as TileOptions} from 'ol/layer/BaseTile';

import SparqlJson from '../../../common/layers/hs.source.SparqlJson';
import {HsAddDataCommonService} from '../../add-data/common/common.service';
import {HsAddDataVectorService} from '../../add-data/vector/vector.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLaymanBrowserService} from '../../add-data/catalogue/layman/layman.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUrlWfsService} from '../../add-data/url/wfs/wfs.service';
import {HsVectorLayerOptions} from '../../add-data/vector/vector-layer-options.type';
import {HsWfsGetCapabilitiesService} from '../../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../../common/get-capabilities/wmts-get-capabilities.service';
import {setDefinition} from '../../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLayerParserService {
  currentUser;

  constructor(
    public HsMapService: HsMapService,
    public HsAddDataVectorService: HsAddDataVectorService,
    public HsStylerService: HsStylerService,
    public HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public HsLanguageService: HsLanguageService,
    public HsToastService: HsToastService,
    public HsEventBusService: HsEventBusService,
    public HsUrlWfsService: HsUrlWfsService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsAddDataCommonService: HsAddDataCommonService,
    private HsLaymanBrowserService: HsLaymanBrowserService
  ) {}

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @description Initiate creation of WFS layer thorough HsUrlWfsService
   */
  async createWFSLayer(lyr_def): Promise<Layer<Source>[]> {
    this.hsAddDataCommonService.layerToSelect = lyr_def.name;
    const wrapper = await this.hsWfsGetCapabilitiesService.request(
      lyr_def.protocol.url
    );
    return await this.HsUrlWfsService.listLayerFromCapabilities(
      wrapper,
      lyr_def.style
    );
  }

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Tile layer
   * @description Parse definition object to create WMTS Ol.layer  (source = ol.source.WMTS)
   */
  async createWMTSLayer(lyr_def): Promise<Tile<TileSource>> {
    const wmts = new Tile({
      source: new WMTS({} as any),
      properties: {
        title: lyr_def.title,
        info_format: lyr_def.info_format,
      },
    });

    // Get WMTS Capabilities and create WMTS source base on it
    const wrapper = await this.HsWmtsGetCapabilitiesService.request(
      lyr_def.url
    );
    try {
      //parse the XML response and create options object...
      const parser = new WMTSCapabilities();
      const result = parser.read(wrapper.response);
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
      this.HsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'ADDLAYERS.capabilitiesParsingProblem'
        ),
        this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          error
        ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsCompositionsLayerParserService',
        }
      );
      this.HsMapService.map.getLayers().remove(wmts);
    }

    wmts.setVisible(lyr_def.visibility);
    return wmts;
  }

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create WMS Ol.layer  (source = ol.source.ImageWMS / ol.source.TileWMS)
   */
  createWmsLayer(lyr_def) {
    const params = lyr_def.params;
    const legends = this.getLegends(lyr_def);
    delete params.REQUEST;
    //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
    const url = decodeURIComponent(lyr_def.url);
    const sourceOptions = {
      url: url,
      attributions: lyr_def.attribution
        ? `<a href="${lyr_def.attribution.OnlineResource}">${lyr_def.attribution.Title}</a>`
        : undefined,
      params,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection?.toUpperCase(),
      ratio: lyr_def.ratio,
    };
    const source = lyr_def.singleTile
      ? new ImageWMS(sourceOptions)
      : new TileWMS(sourceOptions);
    const layerOptions = {
      title: lyr_def.title,
      fromComposition: true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      showInLayerManager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base,
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      path: lyr_def.path,
      opacity: lyr_def.opacity || 1,
      source,
      subLayers: lyr_def.subLayers,
    };
    const new_layer = lyr_def.singleTile
      ? new ImageLayer(layerOptions as ImageOptions<ImageSource>)
      : new Tile(layerOptions as TileOptions<TileSource>);

    new_layer.setVisible(lyr_def.visibility);
    this.HsMapService.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create ArcGIS Ol.layer  (source = ol.source.ImageArcGISRest / ol.source.TileArcGISRest)
   */
  createArcGISLayer(lyr_def) {
    const params = lyr_def.params;
    const legends = this.getLegends(lyr_def);
    if (params) {
      delete params.REQUEST;
    }
    //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
    const sourceOptions = {
      url: decodeURIComponent(lyr_def.url),
      attributions: lyr_def.attribution
        ? `<a href="${lyr_def.attribution.OnlineResource}">${lyr_def.attribution.Title}</a>`
        : undefined,
      params,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection?.toUpperCase(),
      ratio: lyr_def.ratio,
    };
    const source = lyr_def.singleTile
      ? new ImageArcGISRest(sourceOptions)
      : new TileArcGISRest(sourceOptions);
    const layerOptions = {
      title: lyr_def.title,
      fromComposition: true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      showInLayerManager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base,
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      path: lyr_def.path,
      opacity: lyr_def.opacity || 1,
      source,
    };
    const new_layer = new lyr_def.singleTile()
      ? new ImageLayer(layerOptions as ImageOptions<ImageSource>)
      : new Tile(layerOptions as TileOptions<TileSource>);

    new_layer.setVisible(lyr_def.visibility);
    //TODO Proxify
    //OlMap.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create XYZ Ol.layer
   */
  createXYZLayer(lyr_def) {
    const legends = this.getLegends(lyr_def);
    const source = new XYZ({
      url: decodeURIComponent(lyr_def.url),
      attributions: lyr_def.attribution
        ? `<a href="${lyr_def.attribution.OnlineResource}">${lyr_def.attribution.Title}</a>`
        : undefined,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection?.toUpperCase(),
      wrapX: lyr_def.wrapX,
      //TODO Add the rest of parameters and describe in the composition schema
    });
    const new_layer = new Tile({
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      opacity: lyr_def.opacity || 1,
      source,
      properties: {
        title: lyr_def.title,
        fromComposition: true,
        showInLayerManager: lyr_def.displayInLayerSwitcher,
        abstract: lyr_def.name || lyr_def.abstract,
        base: lyr_def.base || lyr_def.url.indexOf('openstreetmap') > -1,
        metadata: lyr_def.metadata,
        dimensions: lyr_def.dimensions,
        legends: legends,
        path: lyr_def.path,
      },
    });

    new_layer.setVisible(lyr_def.visibility);
    //TODO Proxify
    //OlMap.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {object} Ol Image or Tile layer
   * @description Parse definition object to create ImageStatic Ol.layer
   */
  createStaticImageLayer(lyr_def) {
    const legends = this.getLegends(lyr_def);
    const source = new ImageStatic({
      url: decodeURIComponent(lyr_def.url),
      attributions: lyr_def.attribution
        ? `<a href="${lyr_def.attribution.OnlineResource}">${lyr_def.attribution.Title}</a>`
        : undefined,
      imageExtent: lyr_def.extent,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection?.toUpperCase(),
      //TODO Add the rest of parameters and describe in the composition schema
    });
    const new_layer = new ImageLayer({
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      opacity: lyr_def.opacity || 1,
      source,
      properties: {
        title: lyr_def.title,
        fromComposition: true,
        showInLayerManager: lyr_def.displayInLayerSwitcher,
        abstract: lyr_def.name || lyr_def.abstract,
        base: lyr_def.base,
        metadata: lyr_def.metadata,
        dimensions: lyr_def.dimensions,
        legends: legends,
        path: lyr_def.path,
      },
    });

    new_layer.setVisible(lyr_def.visibility);
    return new_layer;
  }

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @description  Parse definition object to create Sparql layer
   */
  async createSparqlLayer(
    lyr_def
  ): Promise<VectorLayer<VectorSource<Geometry>>> {
    const url = decodeURIComponent(lyr_def.protocol.url);
    const definition: any = {};
    definition.url = url;
    definition.format = 'hs.format.Sparql';

    let style = null;
    if (lyr_def.style) {
      style = (await this.HsStylerService.parseStyle(lyr_def.style)).style;
    }

    const src = new SparqlJson({
      geom_attribute: '?geom',
      url: url,
      category: 'http://www.openvoc.eu/poi#categoryWaze',
      projection: 'EPSG:3857',
    });

    const lyr = new VectorLayer({
      properties: {
        title: lyr_def.title,
        fromComposition: true,
        definition,
      },
      source: src,
      opacity: lyr_def.opacity || 1,
      style: style,
    });
    lyr.setVisible(lyr_def.visibility);
    return lyr;
  }

  getLegends(lyr_def): string[] {
    if (lyr_def.legends) {
      return lyr_def.legends.map((legend) => decodeURIComponent(legend));
    }
    return [];
  }

  /**
   * @public
   * @param {object} lyr_def Layer definition object
   * @returns {ol.layer.Vector|Function} Either valid vector layer or function for creation of other supported vector file types)
   * @description Parse definition object to create Vector layer (classic Ol.vector, KML, GeoJSON, WFS, Sparql)
   */
  async createVectorLayer(
    lyr_def
  ): Promise<VectorLayer<VectorSource<Geometry>>> {
    try {
      let format = '';
      if (lyr_def.protocol) {
        format = lyr_def.protocol.format;
        if (lyr_def.protocol.url !== undefined) {
          lyr_def.protocol.url = decodeURIComponent(lyr_def.protocol.url);
        }
      }
      const options: HsVectorLayerOptions = {
        opacity: lyr_def.opacity || 1,
        fromComposition: true,
        path: lyr_def.path,
        visible: lyr_def.visibility,
        // Extract workspace name for partial backwards compatibility.
        workspace:
          lyr_def.workspace ||
          lyr_def.protocol?.url.split('geoserver/')[1].split('/')[0],
      };
      let extractStyles = true;
      if (lyr_def.style) {
        if (
          typeof lyr_def.style == 'string' &&
          (lyr_def.style as string).startsWith('http')
        ) {
          try {
            lyr_def.style = await this.HsLaymanBrowserService.getStyleFromUrl(
              lyr_def.style
            );
          } catch (ex) {
            console.warn('Could not get style from ' + lyr_def.style);
          }
        }
        Object.assign(
          options,
          await this.HsStylerService.parseStyle(lyr_def.style)
        );
        extractStyles = false;
      }
      const title = lyr_def.title || 'Layer';
      let layer;
      switch (format) {
        case 'ol.format.KML':
          layer = await this.HsAddDataVectorService.createVectorLayer(
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
          layer = await this.HsAddDataVectorService.createVectorLayer(
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
          layer = await this.HsAddDataVectorService.createVectorLayer(
            'wfs',
            lyr_def.protocol.url,
            //lyr_def.protocol.LAYERS
            lyr_def.name || title,
            title,
            lyr_def.abstract,
            lyr_def.projection?.toUpperCase(),
            options
          );
          break;
        case 'hs.format.Sparql':
          layer = await this.createSparqlLayer(lyr_def);
          break;
        default:
          const features = lyr_def.features
            ? new GeoJSON().readFeatures(lyr_def.features, {
                dataProjection: 'EPSG:4326',
                featureProjection: this.HsMapService.getCurrentProj(),
              })
            : undefined;
          layer = await this.HsAddDataVectorService.createVectorLayer(
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
              fromComposition: lyr_def.fromComposition,
              style: lyr_def.style,
              features,
            }
          );
      }
      setDefinition(layer, lyr_def.protocol);
      return layer;
    } catch (error) {
      return null;
    }
  }
}
