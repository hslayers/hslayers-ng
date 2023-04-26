import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import {GeoJSON} from 'ol/format';
import {Geometry} from 'ol/geom';
import {
  ImageArcGISRest,
  Image as ImageSource,
  ImageStatic,
  ImageWMS,
  Source,
  TileArcGISRest,
  Tile as TileSource,
  TileWMS,
  Vector as VectorSource,
  XYZ,
} from 'ol/source';
import {
  Image as ImageLayer,
  Layer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';
// eslint-disable-next-line import/named
import {Options as ImageOptions} from 'ol/layer/BaseImage';
// eslint-disable-next-line import/named
import {Options as TileOptions} from 'ol/layer/BaseTile';
import {WMTSCapabilities} from 'ol/format';

import SparqlJson from '../../../common/layers/hs.source.SparqlJson';
import {HsAddDataCommonService} from '../../add-data/common/common.service';
import {HsAddDataVectorService} from '../../add-data/vector/vector.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLaymanBrowserService} from '../../add-data/catalogue/layman/layman.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsUrlWfsService} from '../../add-data/url/wfs/wfs.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsVectorLayerOptions} from '../../add-data/vector/vector-layer-options.type';
import {HsWfsGetCapabilitiesService} from '../../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../../common/get-capabilities/wmts-get-capabilities.service';
import {WfsSource} from '../../../common/layers/hs.source.WfsSource';
import {setDefinition} from '../../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLayerParserService {
  constructor(
    private hsMapService: HsMapService,
    private HsAddDataVectorService: HsAddDataVectorService,
    private HsStylerService: HsStylerService,
    private HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    private HsLanguageService: HsLanguageService,
    private HsToastService: HsToastService,
    private HsUrlWfsService: HsUrlWfsService,
    private hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    private hsAddDataCommonService: HsAddDataCommonService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private HsUtilsService: HsUtilsService,
    private HttpClient: HttpClient
  ) {}

  /**
   * Initiate creation of WFS layer through HsUrlWfsService
   *
   * @public
   * @param lyr_def - Layer definition object
   */
  async createWFSLayer(lyr_def): Promise<Layer<Source>> {
    const newLayer = new VectorLayer({
      properties: {
        name: lyr_def.name,
        title: lyr_def.title.replace(/\//g, '&#47;'),
        path: lyr_def.path,
        removable: true,
        sld: lyr_def.sld ?? lyr_def.style,
        qml: lyr_def.qml,
        wfsUrl: lyr_def.protocol.url.split('?')[0],
      },
      source: new WfsSource(this.HsUtilsService, this.HttpClient, {
        data_version: lyr_def.protocol.version,
        output_format: lyr_def.protocol.output_format,
        crs: lyr_def.projection,
        provided_url: lyr_def.protocol.url.split('?')[0],
        layer_name: lyr_def.name,
        map_projection: this.hsMapService.getMap().getView().getProjection(),
      }),
      renderOrder: null,
      //Used to determine whether its URL WFS service when saving to compositions
    });
    return newLayer;
  }

  /**
   * @public
   * Parse definition object to create WMTS Ol.layer  (source = ol.source.WMTS)
   * @param lyr_def - Layer definition object
   
   * @returns Ol Tile layer
   */
  async createWMTSLayer(lyr_def): Promise<Tile<TileSource>> {
    const wmts = new Tile({
      source: new WMTS({} as any),
      className: lyr_def.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
      properties: {
        title: lyr_def.title,
        info_format: lyr_def.info_format,
        base: lyr_def.base,
        greyscale: lyr_def.greyscale,
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
      this.hsMapService.proxifyLayerLoader(wmts, true);
    } catch (error) {
      this.HsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'ADDLAYERS.capabilitiesParsingProblem',
          undefined
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
      this.hsMapService.getMap().getLayers().remove(wmts);
    }

    wmts.setVisible(lyr_def.visibility);
    return wmts;
  }

  /**
   * @public
   * Parse definition object to create WMS Ol.layer  (source = ol.source.ImageWMS / ol.source.TileWMS)
   * @param lyr_def - Layer definition object
   
   * @returns Ol Image or Tile layer
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
      fromComposition: lyr_def.fromComposition ?? true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      showInLayerManager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base,
      greyscale: lyr_def.greyscale,
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      path: lyr_def.path,
      opacity: parseInt(lyr_def.opacity) || 1,
      source,
      subLayers: lyr_def.subLayers,
      className: lyr_def.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
    };
    const new_layer = lyr_def.singleTile
      ? new ImageLayer(layerOptions as ImageOptions<ImageSource>)
      : new Tile(layerOptions as TileOptions<TileSource>);

    new_layer.setVisible(lyr_def.visibility);
    this.hsMapService.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @public
   * Parse definition object to create ArcGIS Ol.layer  (source = ol.source.ImageArcGISRest / ol.source.TileArcGISRest)
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
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
      fromComposition: lyr_def.fromComposition ?? true,
      maxResolution: lyr_def.maxResolution || Infinity,
      minResolution: lyr_def.minResolution || 0,
      showInLayerManager: lyr_def.displayInLayerSwitcher,
      abstract: lyr_def.name || lyr_def.abstract,
      base: lyr_def.base,
      greyscale: lyr_def.greyscale,
      className: lyr_def.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
      metadata: lyr_def.metadata,
      dimensions: lyr_def.dimensions,
      legends: legends,
      path: lyr_def.path,
      opacity: parseInt(lyr_def.opacity) || 1,
      source,
    };
    const new_layer = lyr_def.singleTile
      ? new ImageLayer(layerOptions as ImageOptions<ImageSource>)
      : new Tile(layerOptions as TileOptions<TileSource>);

    new_layer.setVisible(lyr_def.visibility);
    //TODO Proxify
    //OlMap.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * @public
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
   * Parse definition object to create XYZ Ol.layer
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
      opacity: parseInt(lyr_def.opacity) || 1,
      source,
      className: lyr_def.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
      properties: {
        title: lyr_def.title,
        fromComposition: lyr_def.fromComposition ?? true,
        showInLayerManager: lyr_def.displayInLayerSwitcher,
        abstract: lyr_def.name || lyr_def.abstract,
        base: lyr_def.base || lyr_def.url.indexOf('openstreetmap') > -1,
        greyscale: lyr_def.greyscale,
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
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
   * Parse definition object to create ImageStatic Ol.layer
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
      className: lyr_def.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
      opacity: parseInt(lyr_def.opacity) || 1,
      source,
      properties: {
        title: lyr_def.title,
        fromComposition: lyr_def.fromComposition ?? true,
        showInLayerManager: lyr_def.displayInLayerSwitcher,
        abstract: lyr_def.name || lyr_def.abstract,
        base: lyr_def.base,
        greyscale: lyr_def.greyscale,
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
   * @param lyr_def - Layer definition object
   * Parse definition object to create Sparql layer
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
      geomAttribute: '?geom',
      url: url,
      category: 'http://www.openvoc.eu/poi#categoryWaze',
      projection: 'EPSG:3857',
    });

    const lyr = new VectorLayer({
      properties: {
        title: lyr_def.title,
        fromComposition: lyr_def.fromComposition ?? true,
        definition,
      },
      source: src,
      opacity: parseInt(lyr_def.opacity) || 1,
      style: style,
    });
    lyr.setVisible(lyr_def.visibility);
    return lyr;
  }

  /**
   * @public
   * @param lyr_def - Layer definition object
   * Get layer legends
   */
  getLegends(lyr_def): string[] {
    if (lyr_def.legends) {
      return lyr_def.legends.map((legend) => decodeURIComponent(legend));
    }
    return [];
  }

  /**
   * @public
   * @param lyr_def - Layer definition object
   * @returns Either valid vector layer or function for creation of other supported vector file types)
   * Parse definition object to create Vector layer (classic Ol.vector, KML, GeoJSON, WFS, Sparql)
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
        opacity: parseInt(lyr_def.opacity) || 1,
        fromComposition: lyr_def.fromComposition ?? true,
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
            lyr_def.style = await this.hsCommonLaymanService.getStyleFromUrl(
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
                featureProjection: this.hsMapService.getCurrentProj(),
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
              opacity: parseInt(lyr_def.opacity),
              visible: lyr_def.visibility,
              path: lyr_def.path,
              fromComposition: lyr_def.fromComposition,
              style: options.style ?? lyr_def.style,
              sld: options.sld,
              qml: options.qml,
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
