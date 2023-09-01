import {Injectable} from '@angular/core';

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

import {HsAddDataOwsService} from '../../add-data/url/add-data-ows.service';
import {HsAddDataVectorService} from '../../add-data/vector/vector.service';
import {HsCommonLaymanService} from '../../../common/layman/layman.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapService} from '../../map/map.service';
import {HsStylerService} from '../../styles/styler.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {HsVectorLayerOptions} from '../../add-data/vector/vector-layer-options.type';
import {SparqlJson} from '../../../common/layers/hs.source.SparqlJson';
import {setDefinition} from '../../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsLayerParserService {
  constructor(
    private hsMapService: HsMapService,
    private HsAddDataVectorService: HsAddDataVectorService,
    private HsStylerService: HsStylerService,
    private HsLanguageService: HsLanguageService,
    private hsLog: HsLogService,
    private HsToastService: HsToastService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsAddDataOwsService: HsAddDataOwsService,
  ) {}

  /**
   * Initiate creation of WFS layer through HsUrlWfsService
   * Create WFS layer from capabilities
   *
   * @public
   * @param lyr_def - Layer definition object
   */
  async createWFSLayer(lyr_def): Promise<Layer<Source>> {
    const style = (lyr_def.sld || lyr_def.qml) ?? lyr_def.style;
    const newLayer = await this.hsAddDataOwsService.connectToOWS({
      type: 'wfs',
      uri: lyr_def.protocol.url.split('?')[0],
      layer: lyr_def.name,
      owrCache: false,
      getOnly: true,
      layerOptions: {
        style: style,
        path: lyr_def.path,
        fromComposition: true,
      },
    });
    return newLayer[0];
  }

  /**
   * Parse definition object to create WMTS Ol.layer  (source = ol.source.WMTS)
   * @public
   * @param lyr_def - Layer definition object
   * @returns Ol Tile layer
   */
  async createWMTSLayer(lyr_def): Promise<Layer<Source>> {
    try {
      const newLayer = await this.hsAddDataOwsService.connectToOWS({
        type: 'wmts',
        uri: lyr_def.protocol.url.split('?')[0],
        layer: lyr_def.name,
        owrCache: false,
        getOnly: true,
        layerOptions: {
          title: lyr_def.title,
          info_format: lyr_def.info_format,
          base: lyr_def.base,
          greyscale: lyr_def.greyscale,
        },
      });
      return newLayer[0];
    } catch (error) {
      this.HsToastService.createToastPopupMessage(
        this.HsLanguageService.getTranslation(
          'ADDLAYERS.capabilitiesParsingProblem',
          undefined,
        ),
        this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ERRORMESSAGES',
          error,
        ),
        {
          disableLocalization: true,
          serviceCalledFrom: 'HsCompositionsLayerParserService',
        },
      );
    }
  }

  /**
   * Parse definition object to create WMS Ol.layer  (source = ol.source.ImageWMS / ol.source.TileWMS)
   * @public
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
   * Parse definition object to create ArcGIS Ol.layer  (source = ol.source.ImageArcGISRest / ol.source.TileArcGISRest)
   * @public
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
   */
  async createArcGISLayer(lyr_def) {
    const newLayer = await this.hsAddDataOwsService.connectToOWS({
      type: 'arcgis',
      uri: lyr_def.url.split('tile/{z}/{y}/{x}')[0],
      layer: lyr_def.title,
      owrCache: false,
      getOnly: true,
      layerOptions: {
        title: lyr_def.title,
        base: lyr_def.base,
        greyscale: lyr_def.greyscale,
      },
    });
    return newLayer[0];
  }

  /**
   * Parse definition object to create XYZ Ol.layer
   * @public
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
   */
  async createXYZLayer(lyr_def) {
    lyr_def.url = decodeURIComponent(lyr_def.url);
    /**
     * FIXME : NOT 100% reliable need to be revised along with
     * loading of TileArcGISRest and ImageArcGISRest layers
     */
    if (lyr_def.url.includes('/rest/services/')) {
      const newLayer = await this.hsAddDataOwsService.connectToOWS({
        type: 'arcgis',
        uri: lyr_def.url.split('tile/{z}/{y}/{x}')[0],
        layer: lyr_def.title,
        owrCache: false,
        getOnly: true,
        layerOptions: {
          title: lyr_def.title,
          base: lyr_def.base,
          greyscale: lyr_def.greyscale,
        },
      });
      return newLayer[0];
    }
    const legends = this.getLegends(lyr_def);
    const source = new XYZ({
      url: decodeURIComponent(lyr_def.url),
      attributions: lyr_def.attribution
        ? `<a href="${lyr_def.attribution.OnlineResource}">${lyr_def.attribution.Title}</a>`
        : undefined,
      crossOrigin: 'anonymous',
      projection: lyr_def.projection?.toUpperCase(),
      wrapX: lyr_def.wrapX,
      //TODO: Add the rest of parameters and describe in the composition schema
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
    //TODO: Proxify
    //OlMap.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
    return new_layer;
  }

  /**
   * Parse definition object to create ImageStatic Ol.layer
   * @public
   * @param lyr_def - Layer definition object
   * @returns OL Image or Tile layer
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
      //TODO: Add the rest of parameters and describe in the composition schema
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
   * Parse definition object to create Sparql layer
   * @public
   * @param lyr_def - Layer definition object
   */
  async createSparqlLayer(
    lyr_def,
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
   * Get layer legends
   * @public
   * @param lyr_def - Layer definition object
   */
  getLegends(lyr_def): string[] {
    if (lyr_def.legends) {
      return lyr_def.legends.map((legend) => decodeURIComponent(legend));
    }
    return [];
  }

  /**
   * Parse definition object to create Vector layer (classic Ol.vector, KML, GeoJSON, WFS, Sparql)
   * @public
   * @param lyr_def - Layer definition object
   * @returns Either valid vector layer or function for creation of other supported vector file types)
   */
  async createVectorLayer(
    lyr_def,
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
              lyr_def.style,
            );
          } catch (ex) {
            this.hsLog.warn('Could not get style from ' + lyr_def.style);
          }
        }
        Object.assign(
          options,
          await this.HsStylerService.parseStyle(lyr_def.style),
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
            Object.assign(options, {extractStyles}),
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
            options,
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
            options,
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
            },
          );
      }
      setDefinition(layer, lyr_def.protocol);
      return layer;
    } catch (error) {
      return null;
    }
  }
}
