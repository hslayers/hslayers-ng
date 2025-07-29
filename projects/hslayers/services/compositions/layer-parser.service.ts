import {Injectable} from '@angular/core';

import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {Image as ImageLayer, Layer, Vector as VectorLayer} from 'ol/layer';
import {ImageStatic, Source, Vector as VectorSource} from 'ol/source';

import {
  HsAddDataOwsService,
  HsAddDataVectorService,
} from 'hslayers-ng/services/add-data';
import {
  HsCommonLaymanLayerService,
  HsCommonLaymanService,
  isLaymanUrl,
} from 'hslayers-ng/common/layman';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsVectorLayerOptions, OwsConnection} from 'hslayers-ng/types';
import {SparqlJson} from 'hslayers-ng/common/layers';
import {setDefinition} from 'hslayers-ng/common/extensions';

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
    private hsCommonLaymanLayerService: HsCommonLaymanLayerService,
    private hsAddDataOwsService: HsAddDataOwsService,
  ) {}

  /**
   * Initiate creation of WFS layer through HsUrlWfsService
   * Create WFS layer from capabilities
   *
   * @param lyr_def - Layer definition object
   */
  async createWFSLayer(lyr_def): Promise<Layer<Source>> {
    try {
      const {name, workspace} = isLaymanUrl(
        lyr_def.protocol.url,
        this.hsCommonLaymanService.layman(),
      )
        ? await this.hsCommonLaymanLayerService.getLayerWithUUID(
            lyr_def.name.split('_')[1],
          )
        : {name: lyr_def.name, workspace: lyr_def.workspace};

      const style = (lyr_def.sld || lyr_def.qml) ?? lyr_def.style;
      const uri = lyr_def.protocol.url.split('?')[0];
      const newLayer = await this.hsAddDataOwsService.connectToOWS({
        type: 'wfs',
        uri,
        layer: lyr_def.name,
        owrCache: false,
        getOnly: true,
        layerOptions: {
          style: style,
          path: lyr_def.path,
          fromComposition: true,
          opacity: parseFloat(lyr_def.opacity) ?? 1,
        },
        connectOptions: {
          laymanLayer: isLaymanUrl(uri, this.hsCommonLaymanService.layman())
            ? {
                title: lyr_def.title,
                layer: lyr_def.name,
                name: name,
                workspace: workspace,
                link: uri,
                type: 'wfs',
              }
            : undefined,
        },
      });
      newLayer[0].setVisible(lyr_def.visibility);
      return newLayer[0];
    } catch (error) {
      this.hsLog.error(error);
    }
  }

  /**
   * Parse definition object to create WMTS Ol.layer  (source = ol.source.WMTS)
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
          greyscale: lyr_def.greyscale,
          fromComposition: true,
          opacity: parseFloat(lyr_def.opacity) ?? 1,
        },
        connectOptions: {
          base: lyr_def.base,
          info_format: lyr_def.info_format,
        },
      });
      newLayer[0].setVisible(lyr_def.visibility);
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
   * Get WMS layer options
   * @param lyr_def - Layer definition object
   * @returns WMS layer options
   */
  private getWmsLayerOptions(lyr_def) {
    return {
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
      legends: this.getLegends(lyr_def),
      path: lyr_def.path,
      opacity: parseFloat(lyr_def.opacity) ?? 1,
      subLayers: lyr_def.subLayers,
      useTiles: !lyr_def.singleTile,
      className: lyr_def.greyscale ? 'ol-layer hs-greyscale' : 'ol-layer',
    };
  }

  /**
   * Parse definition object to create WMS Ol.layer  (source = ol.source.ImageWMS / ol.source.TileWMS)
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
   */
  async createWmsLayer(lyr_def) {
    try {
      const params = lyr_def.params;
      delete params.REQUEST;
      //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
      const url = decodeURIComponent(lyr_def.url);

      const owsConnection: OwsConnection = {
        type: 'wms',
        uri: url,
        owrCache: false,
        getOnly: true,
        layerOptions: this.getWmsLayerOptions(lyr_def),
      };

      if (isLaymanUrl(url, this.hsCommonLaymanService.layman())) {
        //Query GET /layer to obtain name and workspace of layer
        const layer = await this.hsCommonLaymanLayerService.getLayerWithUUID(
          lyr_def.params.LAYERS.split('_')[1],
          {useCache: true},
        );

        owsConnection.layerOptions.workspace = layer.workspace;
        owsConnection.connectOptions = {
          laymanLayer: {
            title: lyr_def.title,
            layer: layer.uuid,
            name: layer.name,
            workspace: layer.workspace,
            link: url,
            type: 'wms',
          },
        };
      } else {
        owsConnection.layerOptions.params = params;
        owsConnection.layer = params.LAYERS;
        //If multiple layers are selected, it is a group
        owsConnection.connectOptions = {
          group: params.LAYERS.includes(','),
        };
      }

      const newLayer =
        await this.hsAddDataOwsService.connectToOWS(owsConnection);
      return newLayer[0];
    } catch (error) {
      this.hsLog.error(error);
    }
  }

  /**
   * Parse definition object to create ArcGIS Ol.layer  (source = ol.source.ImageArcGISRest / ol.source.TileArcGISRest)
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
   */
  async createArcGISLayer(lyr_def) {
    try {
      const newLayer = await this.hsAddDataOwsService.connectToOWS({
        type: 'arcgis',
        uri: lyr_def.url.split('tile/{z}/{y}/{x}')[0],
        /**
         * Allows sublayer definition in compositions as
         */
        layer: lyr_def.subLayers?.split(',') || lyr_def.title,
        owrCache: false,
        getOnly: true,
        layerOptions: {
          title: lyr_def.title,
          greyscale: lyr_def.greyscale,
          fromComposition: true,
          opacity: parseFloat(lyr_def.opacity) ?? 1,
        },
        connectOptions: {
          base: lyr_def.base,
        },
      });
      newLayer[0].setVisible(lyr_def.visibility);
      return newLayer[0];
    } catch (error) {
      this.hsLog.error(error);
    }
  }

  /**
   * Parse definition object to create XYZ Ol.layer
   * @param lyr_def - Layer definition object
   * @returns Ol Image or Tile layer
   */
  async createXYZLayer(lyr_def) {
    try {
      lyr_def.url = decodeURIComponent(lyr_def.url);
      if (lyr_def.url.includes('/rest/services/')) {
        return await this.createArcGISLayer(lyr_def);
      }

      const legends = this.getLegends(lyr_def);
      const newLayer = await this.hsAddDataOwsService.connectToOWS({
        type: 'xyz',
        uri: decodeURIComponent(lyr_def.url),
        owrCache: false,
        getOnly: true,
        layer: lyr_def.title,
        layerOptions: {
          title: lyr_def.title,
          fromComposition: lyr_def.fromComposition ?? true,
          showInLayerManager: lyr_def.displayInLayerSwitcher,
          abstract: lyr_def.title || lyr_def.abstract,
          base: lyr_def.base,
          legends: legends,
          path: lyr_def.path,
          greyscale: lyr_def.greyscale,
          opacity: parseFloat(lyr_def.opacity) ?? 1,
          minResolution: lyr_def.minResolution,
          maxResolution: lyr_def.maxResolution,
          // dimensions: lyr_def.dimensions,
        },
      });

      newLayer[0].setVisible(lyr_def.visibility);
      return newLayer[0];
    } catch (error) {
      this.hsLog.error(error);
    }
  }

  /**
   * Parse definition object to create ImageStatic Ol.layer
   * @param lyr_def - Layer definition object
   * @returns OL Image or Tile layer
   */
  createStaticImageLayer(lyr_def) {
    try {
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
        opacity: parseFloat(lyr_def.opacity) ?? 1,
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
    } catch (error) {
      this.hsLog.error(error);
    }
  }

  /**
   * Parse definition object to create Sparql layer
   * @param lyr_def - Layer definition object
   */
  async createSparqlLayer(
    lyr_def,
  ): Promise<VectorLayer<VectorSource<Feature>>> {
    try {
      const url = decodeURIComponent(lyr_def.protocol.url);
      const definition: any = {};
      definition.url = url;
      definition.format = 'Sparql';

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
        opacity: parseFloat(lyr_def.opacity) ?? 1,
        style: style,
      });
      lyr.setVisible(lyr_def.visibility);
      return lyr;
    } catch (error) {
      this.hsLog.error(error);
    }
  }

  /**
   * Get layer legends
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
   * @param lyr_def - Layer definition object
   * @returns Either valid vector layer or function for creation of other supported vector file types)
   */
  async createVectorLayer(
    lyr_def,
  ): Promise<VectorLayer<VectorSource<Feature>>> {
    try {
      let format = '';
      if (lyr_def.protocol) {
        format = lyr_def.protocol.format;
        if (lyr_def.protocol.url !== undefined) {
          lyr_def.protocol.url = decodeURIComponent(lyr_def.protocol.url);
        }
      }
      const options: HsVectorLayerOptions = {
        opacity: parseFloat(lyr_def.opacity) ?? 1,
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
        // Parse the style definition (SLD, QML, or standard style object)
        const styleType = await this.HsStylerService.guessStyleFormat(
          lyr_def.style,
        );
        // Assign the appropriate style property to options
        if (styleType == 'sld') {
          options.sld = lyr_def.style;
        } else if (styleType == 'qml') {
          options.qml = lyr_def.style;
        } else {
          console.warn(
            `Compositions layer ${lyr_def.title} was provided with unknown style format`,
            lyr_def.style,
          );
        }
        extractStyles = false;
      }
      const title = lyr_def.title || 'Layer';
      let name = lyr_def.name || title;
      //TODO: Find better way to identify uuid
      if (name.includes('l_') && name.includes('-') && name.length > 36) {
        const layerDescriptor =
          await this.hsCommonLaymanLayerService.getLayerWithUUID(
            name.split('_')[1],
          );
        if (layerDescriptor) {
          name = layerDescriptor.name;
        }
      }

      let layer;
      switch (format) {
        case 'ol.format.KML': //backwards compatibility
        case 'KML':
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
        case 'ol.format.GeoJSON': //backwards compatibility
        case 'GeoJSON':
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
        case 'hs.format.WFS': //backwards compatibility
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
        case 'hs.format.Sparql': //backwards compatibility
        case 'Sparql':
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
              opacity: parseFloat(lyr_def.opacity),
              visible: lyr_def.visibility,
              path: lyr_def.path,
              fromComposition: lyr_def.fromComposition,
              sld: options.sld,
              qml: options.qml,
              features,
            },
          );
      }
      setDefinition(layer, lyr_def.protocol);
      return layer;
    } catch (error) {
      this.hsLog.error(error);
    }
  }
}
