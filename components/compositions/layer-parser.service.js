import '../../common/get-capabilities.module';
import '../add-layers/vector/add-layers-vector.module';
import 'angular-socialshare';
import ImageLayer from 'ol/layer/Image';
import SparqlJson from '../layers/hs.source.SparqlJson';
import VectorLayer from 'ol/layer/Vector';
import WMTS, {optionsFromCapabilities} from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';
import {Attribution} from 'ol/control';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';
import {ImageArcGISRest, ImageStatic, TileArcGISRest, TileWMS} from 'ol/source';
import {ImageWMS, XYZ} from 'ol/source';
import {Tile} from 'ol/layer';

/**
 * @param HsMapService
 * @param HsAddLayersVectorService
 * @param HsWmtsGetCapabilitiesService
 * @param HsUtilsService
 */
export default function (
  HsMapService,
  HsAddLayersVectorService,
  HsWmtsGetCapabilitiesService,
  HsUtilsService
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
     * @name hs.compositions.config_parsers.service#createWMTSLayer
     * @public
     * @param {object} lyr_def Layer definition object
     * @returns {object} Ol Tile layer
     * @description Parse definition object to create WMTS Ol.layer  (source = ol.source.WMTS)
     */
    createWMTSLayer: async function (lyr_def) {
      const wmts = new Tile({
        title: lyr_def.title,
        info_format: lyr_def.info_format,
        source: new WMTS({}),
      });

      // Get WMTS Capabilities and create WMTS source base on it
      const source = await HsWmtsGetCapabilitiesService.requestGetCapabilities(
        lyr_def.url
      ).then((res) => {
        //parse the XML response and create options object...
        const parser = new WMTSCapabilities();
        const result = parser.read(res.data);
        // ...create WMTS Capabilities based on the parsed options
        const options = optionsFromCapabilities(result, {
          layer: lyr_def.layer,
          matrixSet: lyr_def.matrixSet,
          format: lyr_def.format,
        });
        // WMTS source for raster tiles layer
        return new WMTS(options);
      });
      wmts.setSource(source);
      wmts.setVisible(lyr_def.visibility);
      return wmts;
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
        style = me.parseStyle(lyr_def.style);
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
     * @name hs.compositions.config_parsers.service#parseStyle
     * @public
     * @param {object} j Style definition object
     * @returns {ol.style.Style} Valid Ol style object
     * @description Parse style definition object to create valid Style
     */
    parseStyle: function (j) {
      const style_json = {};
      if (angular.isDefined(j.fill)) {
        style_json.fill = new Fill({
          color: j.fill,
        });
      }
      if (angular.isDefined(j.stroke)) {
        style_json.stroke = new Stroke({
          color: j.stroke.color,
          width: j.stroke.width,
        });
      }
      if (angular.isDefined(j.image)) {
        if (j.image.type == 'circle') {
          const circle_json = {};

          if (angular.isDefined(j.image.radius)) {
            circle_json.radius = j.image.radius;
          }

          if (angular.isDefined(j.image.fill)) {
            circle_json.fill = new Fill({
              color: j.image.fill,
            });
          }
          if (angular.isDefined(j.image.stroke)) {
            circle_json.stroke = new Stroke({
              color: j.image.stroke.color,
              width: j.image.stroke.width,
            });
          }
          style_json.image = new Circle(circle_json);
        }
        if (j.image.type == 'icon') {
          const img = new Image();
          img.src = j.image.src;
          if (img.width == 0) {
            img.width = 43;
          }
          if (img.height == 0) {
            img.height = 41;
          }
          const icon_json = {
            img: img,
            imgSize: [img.width, img.height],
            crossOrigin: 'anonymous',
          };
          style_json.image = new Icon(icon_json);
        }
      }
      return new Style(style_json);
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
        if (lyr_def.protocol.url !== undefined) {
          lyr_def.protocol.url = decodeURIComponent(lyr_def.protocol.url);
        }
      }
      const options = {};
      options.opacity = lyr_def.opacity || 1;
      options.from_composition = true;

      let extractStyles = true;
      if (angular.isDefined(lyr_def.style)) {
        options.style = me.parseStyle(lyr_def.style);
        extractStyles = false;
      }
      const title = lyr_def.title || 'Layer';
      let layer;
      switch (format) {
        case 'ol.format.KML':
          layer = HsAddLayersVectorService.createVectorLayer(
            'kml',
            lyr_def.protocol.url,
            title,
            lyr_def.name || title,
            lyr_def.abstract,
            lyr_def.projection.toUpperCase(),
            Object.assign(options, {extractStyles})
          );
          break;
        case 'ol.format.GeoJSON':
          layer = HsAddLayersVectorService.createVectorLayer(
            'geojson',
            lyr_def.protocol.url,
            title,
            lyr_def.name || title,
            lyr_def.abstract,
            lyr_def.projection.toUpperCase(),
            options
          );
          break;
        case 'hs.format.WFS':
          options.defOptions = lyr_def.defOptions;
          layer = HsAddLayersVectorService.createVectorLayer(
            'wfs',
            lyr_def.protocol.url,
            title,
            lyr_def.name || title,
            lyr_def.abstract,
            lyr_def.projection.toUpperCase(),
            options
          );
          break;
        case 'hs.format.Sparql':
          layer = me.createSparqlLayer(lyr_def);
          break;
        default:
          if (angular.isDefined(lyr_def.features)) {
            layer = HsAddLayersVectorService.createVectorLayer(
              '',
              undefined,
              title,
              lyr_def.name || title,
              lyr_def.abstract,
              lyr_def.projection.toUpperCase(),
              lyr_def
            );
          }
      }
      layer.set('definition', lyr_def.protocol);
      return layer;
    },
  };
  return me;
}
