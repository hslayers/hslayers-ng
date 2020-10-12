import '../add-layers/vector/add-layers-vector.module';
import ImageLayer from 'ol/layer/Image';
import SparqlJson from '../layers/hs.source.SparqlJson';
import VectorLayer from 'ol/layer/Vector';
import {Attribution} from 'ol/control';
import {ImageArcGISRest, ImageStatic, TileArcGISRest, TileWMS} from 'ol/source';
import {ImageWMS, XYZ} from 'ol/source';
import {Tile} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

/**
 * @param HsMapService
 * @param HsAddLayersVectorService
 * @param HsStylerService
 */
export default function (
  HsMapService,
  HsAddLayersVectorService,
  HsStylerService
) {
  'ngInject';
  const me = {
    /**
     * @ngdoc method
     * @name hs.compositions.config_parsers.service#createWmsLayer
     * @public
     * @param {object} lyr_def Layer definition object
     * @returns {object} Ol Image or Tile layer
     * @description Parse definition object to create WMS Ol.layer  (source = ol.source.ImageWMS / ol.source.TileWMS)
     */
    createWmsLayer: function (lyr_def) {
      const source_class = lyr_def.singleTile ? ImageWMS : TileWMS;
      const layer_class = lyr_def.singleTile ? ImageLayer : Tile;
      const params = lyr_def.params;
      const legends = [];
      delete params.REQUEST;
      //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
      if (angular.isDefined(lyr_def.legends)) {
        for (let idx_leg = 0; idx_leg < lyr_def.legends.length; idx_leg++) {
          legends.push(decodeURIComponent(lyr_def.legends[idx_leg]));
        }
      }
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
        styles: angular.isDefined(lyr_def.metadata)
          ? lyr_def.metadata.styles
          : undefined,
        params: params,
        crossOrigin: 'anonymous',
        projection: lyr_def.projection,
        ratio: lyr_def.ratio,
      });
      const new_layer = new layer_class({
        title: lyr_def.title,
        from_composition: true,
        maxResolution: lyr_def.maxResolution || Number.Infinity,
        minResolution: lyr_def.minResolution || 0,
        minScale: lyr_def.minScale || Number.Infinity,
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
      HsMapService.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
      return new_layer;
    },
    /**
     * @ngdoc method
     * @name hs.compositions.config_parsers.service#createArcGISLayer
     * @public
     * @param {object} lyr_def Layer definition object
     * @returns {object} Ol Image or Tile layer
     * @description Parse definition object to create ArcGIS Ol.layer  (source = ol.source.ImageArcGISRest / ol.source.TileArcGISRest)
     */
    createArcGISLayer: function (lyr_def) {
      const source_class = lyr_def.singleTile
        ? ImageArcGISRest
        : TileArcGISRest;
      const layer_class = lyr_def.singleTile ? ImageLayer : Tile;
      const params = lyr_def.params;
      const legends = [];
      if (angular.isDefined(params)) {
        delete params.REQUEST;
      }
      //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
      if (angular.isDefined(lyr_def.legends)) {
        for (let idx_leg = 0; idx_leg < lyr_def.legends.length; idx_leg++) {
          legends.push(decodeURIComponent(lyr_def.legends[idx_leg]));
        }
      }
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
        maxResolution: lyr_def.maxResolution || Number.Infinity,
        minResolution: lyr_def.minResolution || 0,
        minScale: lyr_def.minScale || Number.Infinity,
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
    },
    /**
     * @ngdoc method
     * @name hs.compositions.config_parsers.service#createXYZLayer
     * @public
     * @param {object} lyr_def Layer definition object
     * @returns {object} Ol Image or Tile layer
     * @description Parse definition object to create XYZ Ol.layer
     */
    createXYZLayer: function (lyr_def) {
      const source_class = XYZ;
      const layer_class = Tile;
      const legends = [];
      if (angular.isDefined(lyr_def.legends)) {
        for (let idx_leg = 0; idx_leg < lyr_def.legends.length; idx_leg++) {
          legends.push(decodeURIComponent(lyr_def.legends[idx_leg]));
        }
      }
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
        maxResolution: lyr_def.maxResolution || Number.Infinity,
        minResolution: lyr_def.minResolution || 0,
        minScale: lyr_def.minScale || Number.Infinity,
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
    },
    /**
     * @ngdoc method
     * @name hs.compositions.config_parsers.service#createStaticImageLayer
     * @public
     * @param {object} lyr_def Layer definition object
     * @returns {object} Ol Image or Tile layer
     * @description Parse definition object to create ImageStatic Ol.layer
     */
    createStaticImageLayer: function (lyr_def) {
      const source_class = ImageStatic;
      const layer_class = ImageLayer;
      const legends = [];
      if (angular.isDefined(lyr_def.legends)) {
        for (let idx_leg = 0; idx_leg < lyr_def.legends.length; idx_leg++) {
          legends.push(decodeURIComponent(lyr_def.legends[idx_leg]));
        }
      }
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
        maxResolution: lyr_def.maxResolution || Number.Infinity,
        minResolution: lyr_def.minResolution || 0,
        minScale: lyr_def.minScale || Number.Infinity,
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
    },
    /**
     * @ngdoc method
     * @name hs.compositions.config_parsers.service#createSparqlLayer
     * @public
     * @param {object} lyr_def Layer definition object
     * @description  Parse definition object to create Sparql layer
     */
    createSparqlLayer: function (lyr_def) {
      const url = decodeURIComponent(lyr_def.protocol.url);
      const definition = {};
      definition.url = url;
      definition.format = 'hs.format.Sparql';

      let style = null;
      if (angular.isDefined(lyr_def.style)) {
        style = HsStylerService.parseStyle(lyr_def.style);
      }

      const src = new SparqlJson({
        geom_attribute: '?geom',
        url: url,
        category_field: 'http://www.openvoc.eu/poi#categoryWaze',
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
    },
    /**
     * @ngdoc method
     * @name hs.compositions.config_parsers.service#createVectorLayer
     * @public
     * @param {object} lyr_def Layer definition object
     * @returns {ol.layer.Vector|Function} Either valid vector layer or function for creation of other supported vector file types)
     * @description Parse definition object to create Vector layer (classic Ol.vector, KML, GeoJSON, WFS, Sparql)
     */
    createVectorLayer: function (lyr_def) {
      let format = '';
      if (angular.isDefined(lyr_def.protocol)) {
        format = lyr_def.protocol.format;
      }
      const options = {};
      options.opacity = lyr_def.opacity || 1;
      options.from_composition = true;

      let extractStyles = true;
      if (angular.isDefined(lyr_def.style)) {
        options.style = HsStylerService.parseStyle(lyr_def.style);
        extractStyles = false;
      }
      let layer;
      switch (format) {
        case 'ol.format.KML':
          layer = HsAddLayersVectorService.createVectorLayer(
            'kml',
            decodeURIComponent(lyr_def.protocol.url),
            lyr_def.title || 'Layer',
            lyr_def.abstract,
            lyr_def.projection.toUpperCase(),
            Object.assign(options, {extractStyles})
          );
          break;
        case 'ol.format.GeoJSON':
          layer = HsAddLayersVectorService.createVectorLayer(
            'geojson',
            decodeURIComponent(lyr_def.protocol.url),
            lyr_def.title || 'Layer',
            lyr_def.abstract,
            lyr_def.projection.toUpperCase(),
            options
          );
          break;
        case 'hs.format.WFS':
        case 'WFS':
          options.defOptions = lyr_def.defOptions;
          layer = HsAddLayersVectorService.createVectorLayer(
            'wfs',
            decodeURIComponent(lyr_def.protocol.url),
            lyr_def.title || 'Layer',
            lyr_def.abstract,
            lyr_def.projection.toUpperCase(),
            options
          );
          break;
        case 'hs.format.LaymanWfs':
          layer = new VectorLayer({
            title: lyr_def.title,
            name: lyr_def.name || lyr_def.title,
            visibility: lyr_def.visibility,
            from_composition: true,
            synchronize: true,
            editor: {
              editable: true,
              defaultAttributes: {},
            },
            saveState: true,
            source: new VectorSource({}),
          });
          break;
        case 'hs.format.Sparql':
          layer = me.createSparqlLayer(lyr_def);
          break;
        default:
          if (angular.isDefined(lyr_def.features)) {
            layer = HsAddLayersVectorService.createVectorLayer(
              '',
              undefined,
              lyr_def.title || 'Layer',
              lyr_def.abstract,
              lyr_def.projection.toUpperCase(),
              lyr_def
            );
          }
      }
      return layer;
    },
  };
  return me;
}
