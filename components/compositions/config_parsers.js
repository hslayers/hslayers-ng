/**
 * @ngdoc module
 * @module hs.compositions.config_parsers
 * @name hs.compositions.config_parsers
 */

define(['angular', 'ol', 'SparqlJson', 'angularjs-socialshare', 'map', 'ows.nonwms'],

    function(angular, ol, SparqlJson, social) {
        var module = angular.module('hs.compositions.config_parsers', ['720kb.socialshare', 'hs.map', 'hs.core', 'hs.ows.nonwms'])
            /**
            * @module hs.compositions.config_parsers
            * @ngdoc service
            * @name hs.compositions.config_parsers.service
            * @description Service for parsing object definition which are invalid for direct use as layers
            */
            .service('hs.compositions.config_parsers.service', ['hs.map.service', 'config', 'Core', '$rootScope', 'hs.utils.service', 'hs.ows.nonwms.service', function(OlMap, config, Core, $rootScope, utils, nonWmsService) {
                var me = {
                    /**
                    * @ngdoc method
                    * @name hs.compositions.config_parsers.service#createWmsLayer 
                    * @public
                    * @param {Object} lyr_def Layer definition object
                    * @returns {Object} Ol WMS layer
                    * @description Parse definition object to create WMS Ol.layer  (source = ol.source.ImageWMS / ol.source.TileWMS)
                    */
                    createWmsLayer: function(lyr_def) {
                        var source_class = lyr_def.singleTile ? ol.source.ImageWMS : ol.source.TileWMS;
                        var layer_class = lyr_def.singleTile ? ol.layer.Image : ol.layer.Tile;
                        var params = lyr_def.params;
                        var legends = [];
                        delete params.REQUEST;
                        //delete params.FORMAT; Commented, because otherwise when loading from cookie or store, it displays jpeg
                        if (angular.isDefined(lyr_def.legends)) {
                            for (var idx_leg = 0; idx_leg < lyr_def.legends.length; idx_leg++) {
                                legends.push(decodeURIComponent(lyr_def.legends[idx_leg]));
                            }
                        }
                        var new_layer = new layer_class({
                            title: lyr_def.title,
                            from_composition: true,
                            maxResolution: lyr_def.maxResolution || Number.Infinity,
                            minResolution: lyr_def.minResolution || 0,
                            minScale: lyr_def.minScale || Number.Infinity,
                            maxScale: lyr_def.maxScale || 0,
                            show_in_manager: lyr_def.displayInLayerSwitcher,
                            abstract: lyr_def.name,
                            metadata: lyr_def.metadata,
                            dimensions: lyr_def.dimensions,
                            legends: legends,
                            saveState: true,
                            path: lyr_def.path,
                            opacity: lyr_def.opacity || 1,
                            source: new source_class({
                                url: decodeURIComponent(lyr_def.url),
                                attributions: lyr_def.attribution ? [new ol.Attribution({
                                    html: '<a href="' + lyr_def.attribution.OnlineResource + '">' + lyr_def.attribution.Title + '</a>'
                                })] : undefined,
                                styles: lyr_def.metadata.styles,
                                params: params,
                                crossOrigin: 'anonymous',
                                projection: lyr_def.projection,
                                ratio: lyr_def.ratio
                            })
                        });
                        new_layer.setVisible(lyr_def.visibility);
                        OlMap.proxifyLayerLoader(new_layer, !lyr_def.singleTile);
                        return new_layer;

                    },
                    /**
                    * @ngdoc method
                    * @name hs.compositions.config_parsers.service#createSparqlLayer
                    * @public
                    * @param {Object} lyr_def Layer definition object
                    * @description  Parse definition object to create Sparql layer
                    */
                    createSparqlLayer: function(lyr_def) {
                        var url = decodeURIComponent(lyr_def.protocol.url);
                        var definition = {};
                        definition.url = url;
                        definition.format = "hs.format.Sparql";

                        var style = null;
                        if (angular.isDefined(lyr_def.style)) style = me.parseStyle(lyr_def.style);

                        var src = new SparqlJson({
                            geom_attribute: '?geom',
                            url: url,
                            category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                            projection: 'EPSG:3857'
                        });

                        var lyr = new ol.layer.Vector({
                            from_composition: true,
                            definition: definition,
                            source: src,
                            opacity: lyr_def.opacity || 1,
                            style: style,
                            title: lyr_def.title
                        });
                        lyr.setVisible(lyr_def.visibility);
                    },
                    /**
                    * @ngdoc method
                    * @name hs.compositions.config_parsers.service#parseStyle
                    * @public
                    * @param {Object} j Style definition object
                    * @returns {ol.style.Style} Valid Ol style object
                    * @description Parse style definition object to create valid Style
                    */
                    parseStyle: function(j) {
                        var style_json = {};
                        if (angular.isDefined(j.fill)) {
                            style_json.fill = new ol.style.Fill({
                                color: j.fill
                            })
                        }
                        if (angular.isDefined(j.stroke)) {
                            style_json.stroke = new ol.style.Stroke({
                                color: j.stroke.color,
                                width: j.stroke.width
                            })
                        }
                        if (angular.isDefined(j.image)) {
                            if (j.image.type == 'circle') {
                                var circle_json = {};

                                if (angular.isDefined(j.image.radius)) {
                                    circle_json.radius = j.image.radius;
                                }

                                if (angular.isDefined(j.image.fill)) {
                                    circle_json.fill = new ol.style.Fill({
                                        color: j.image.fill
                                    });
                                }
                                if (angular.isDefined(j.image.stroke)) {
                                    circle_json.stroke = new ol.style.Stroke({
                                        color: j.image.stroke.color,
                                        width: j.image.stroke.width
                                    })
                                }
                                style_json.image = new ol.style.Circle(circle_json);
                            }
                            if (j.image.type == 'icon') {
                                var img = new Image();
                                img.src = j.image.src;
                                if (img.width == 0) img.width = 43;
                                if (img.height == 0) img.height = 41;
                                var icon_json = {
                                    img: img,
                                    imgSize: [img.width, img.height],
                                    crossOrigin: 'anonymous'
                                };
                                style_json.image = new ol.style.Icon(icon_json);
                            }
                        }
                        return new ol.style.Style(style_json);
                    },
                    /**
                    * @ngdoc method
                    * @name hs.compositions.config_parsers.service#createVectorLayer
                    * @public
                    * @param {Object} lyr_def Layer definition object
                    * @returns {ol.layer.Vector|function} Either valid vector layer or function for creation of other supported vector file types)
                    * @description Parse definition object to create Vector layer (classic Ol.vector, KML, GeoJSON, WFS, Sparql)
                    */
                    createVectorLayer: function(lyr_def) {
                        var format = "";
                        if (angular.isDefined(lyr_def.protocol)) {
                            format = lyr_def.protocol.format
                        }
                        var options = {}
                        options.opacity = lyr_def.opacity || 1
                        options.from_composition = true;

                        var extractStyles = true
                        if (angular.isDefined(lyr_def.style)) {
                            options.style = me.parseStyle(lyr_def.style);
                            extractStyles = false;
                        }

                        switch (format) {
                            case 'ol.format.KML':

                                var lyr = nonWmsService.add('kml', decodeURIComponent(lyr_def.protocol.url), lyr_def.title || 'Layer', lyr_def.abstract, extractStyles, lyr_def.projection.toUpperCase(), options);
                                return lyr;
                                break;
                            case 'ol.format.GeoJSON':
                                var lyr = nonWmsService.add('geojson', decodeURIComponent(lyr_def.protocol.url), lyr_def.title || 'Layer', lyr_def.abstract, extractStyles, lyr_def.projection.toUpperCase(), options);
                                return lyr;
                                break;
                            case 'hs.format.WFS':
                                options.defOptions = lyr_def.defOptions;
                                var lyr = nonWmsService.add('wfs', decodeURIComponent(lyr_def.protocol.url), lyr_def.title || 'Layer', lyr_def.abstract, extractStyles, lyr_def.projection.toUpperCase(), options);
                                return lyr;
                                break;
                            case 'hs.format.Sparql':
                                return me.createSparqlLayer(lyr_def);
                                break;
                            default:
                                if (angular.isDefined(lyr_def.features)) {
                                    var format = new ol.format.GeoJSON();
                                    var src = new ol.source.Vector({
                                        features: format.readFeatures(lyr_def.features),
                                        projection: ol.proj.get(lyr_def.projection)
                                    });
                                }
                                var style = undefined;
                                if (angular.isDefined(lyr_def.style)) style = me.parseStyle(lyr_def.style);
                                var lyr = new ol.layer.Vector({
                                    from_composition: true,
                                    source: src,
                                    opacity: lyr_def.opacity || 1,
                                    title: lyr_def.title,
                                    style: style
                                });
                                lyr.setVisible(lyr_def.visibility);
                                return lyr;
                        }
                    }
                }
                return me;
            }])
    })
