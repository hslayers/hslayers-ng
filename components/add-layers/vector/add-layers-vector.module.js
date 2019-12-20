import { DragAndDrop } from 'ol/interaction';
import { GPX, IGC, KML, TopoJSON, GeoJSON } from 'ol/format';
import SparqlJson from 'hs.source.SparqlJson'
import WfsSource from 'hs.source.Wfs'
import 'components/styles/styles.module';
import * as loadingstrategy from 'ol/loadingstrategy';
import { transform, transformExtent, get as getProj } from 'ol/proj';
import { Vector } from 'ol/source';
import VectorLayer from 'ol/layer/Vector';

/**
 * @namespace hs.addLayersVector
 * @memberOf hs
 */
angular.module('hs.addLayersVector', ['hs.styles'])
    /**
    * @memberof hs.ows
    * @ngdoc directive
    * @name hs.addLayersVector
    * @description TODO
    */
    .directive('hs.addLayersVector', ['config', function (config) {
        return {
            template: require('./add-vector-layer.directive.html')
        };
    }])
    /**
    * @memberof hs.addLayersVector
    * @ngdoc service
    * @name hs.addLayersVector.service
    * @description Service handling adding nonwms OWS services or files. Handles also drag and drop addition.
    */
    .service('hs.addLayersVector.service', ['config', 'Core', '$rootScope', 'hs.map.service', 'hs.styles.service', 'hs.utils.service', '$http', 'hs.statusManagerService', 'hs.permalink.urlService', 'hs.layout.service',
        function (config, Core, $rootScope, OlMap, styles, utils, $http, statusManagerService, permalink, layoutService) {
            var me = this;

            /**
            * Load nonwms OWS data and create layer
            * @memberof hs.addLayers
            * @function add
            * @param {String} type Type of data to load (supports Kml, Geojson, Wfs and Sparql) 
            * @param {String} url Url of data/service localization
            * @param {String} title Title of new layer
            * @param {String} abstract Abstract of new layer
            * @param {Boolean} extract_styles Extract styles 
            * @param {String} srs EPSG code of selected projection (eg. "EPSG:4326")
            * @param {Object} options Other options  
            */
            me.add = function (type, url, title, abstract, extract_styles, srs, options) {
                var format;
                var definition = {};
                var src;
                definition.url = url;
                if (angular.isUndefined(options)) {
                    var options = {};
                }

                if (type.toLowerCase() != 'sparql' && angular.isDefined(url)) {
                    url = utils.proxify(url);
                }

                if (type == 'kml' || 
                    (angular.isDefined(url) && url.toLowerCase().endsWith('kml'))) {
                    format = new KML({
                        extractStyles: extract_styles
                    });
                    definition.format = "ol.format.KML";
                }
                if (type == 'geojson' || 
                    (angular.isDefined(url) && url.toLowerCase().endsWith('geojson') || url.toLowerCase().endsWith('json'))) {
                    format = new GeoJSON();
                    definition.format = "ol.format.GeoJSON";
                }
                if (angular.isDefined(url) && url.toLowerCase().endsWith('gpx')) {
                    format = new GPX();
                    definition.format = "ol.format.GPX";
                }
                if (type.toLowerCase() == "sparql") {
                    definition.format = "hs.format.Sparql";
                }
                if (definition.format == 'hs.format.Sparql') {
                    src = new SparqlJson({
                        geom_attribute: '?geom',
                        url: url,
                        category_field: 'http://www.openvoc.eu/poi#categoryWaze',
                        projection: 'EPSG:3857',
                        minResolution: 1,
                        maxResolution: 38
                        //feature_loaded: function(feature){feature.set('hstemplate', 'hs.geosparql_directive')}
                    });
                } else if (definition.format == 'hs.format.WFS') {
                    src = new WfsSource(options.defOptions);
                } else if (angular.isDefined(options.features)) {
                    src = createVectorSourceFromFeatures(srs, options);
                    OlMap.map.getView().fit(src.getExtent(), OlMap.map.getSize());
                } else {
                    src = createVectorSource(format, url, extract_styles, srs)
                }
                //src.set('loaded', true); Should be set when ajax call finishes
                src.set('from_composition', options.from_composition || false);
                var lyr = new VectorLayer({
                    abstract: abstract,
                    definition: definition,
                    from_composition: options.from_composition || false,
                    opacity: options.opacity || 1,
                    saveState: true,
                    source: src,
                    style: options.style,
                    title: title
                });

                var key = src.on('propertychange', function (event) {
                    if (event.key == 'loaded') {
                        if (event.oldValue == false) {
                            $rootScope.$broadcast('layermanager.layer_loaded', lyr)
                        } else {
                            $rootScope.$broadcast('layermanager.layer_loading', lyr)
                        }
                    };
                })

                var listenerKey = src.on('change', function (e) {
                    if (src.getState() == 'ready' && (angular.isUndefined(src.get('from_composition')) || !src.get('from_composition'))) {
                        if (src.getFeatures().length == 0) return;
                        var extent = src.getExtent(); //src.unByKey(listenerKey);
                        if (!isNaN(extent[0]) && !isNaN(extent[1]) && !isNaN(extent[2]) && !isNaN(extent[3]))
                            OlMap.map.getView().fit(extent, OlMap.map.getSize());
                    }
                });

                if (options.from_composition != true) {
                    OlMap.map.addLayer(lyr);
                }
                return lyr;
            };

            function createVectorSource(format, url, extract_styles, srs) {
                var src = new Vector({
                    format: format,
                    url: url,
                    projection: getProj(srs),
                    extractStyles: extract_styles,
                    loader: function (extent, resolution, projection) {
                        this.set('loaded', false);
                        var me = this;
                        $http({ url: url }). //context: this?
                            then(function (response) {
                                var data = response.data;
                                if (data.type == 'GeometryCollection') {
                                    var temp = {
                                        type: "Feature",
                                        geometry: data
                                    };
                                    data = temp;
                                }
                                me.addFeatures(format.readFeatures(data, {
                                    dataProjection: srs,
                                    featureProjection: OlMap.map.getView().getProjection().getCode()
                                }));

                                //TODO probably we should not do this. Have to check when styler is operational
                                src.hasLine = false;
                                src.hasPoly = false;
                                src.hasPoint = false;
                                angular.forEach(src.getFeatures(), function (f) {
                                    if (f.getGeometry()) {
                                        switch (f.getGeometry().getType()) {
                                            case 'LineString' || 'MultiLineString':
                                                src.hasLine = true;
                                                break;
                                            case 'Polygon' || 'MultiPolygon':
                                                src.hasPoly = true;
                                                break;
                                            case 'Point' || 'MultiPoint':
                                                src.hasPoint = true;
                                                break;
                                        }
                                    }
                                })

                                if (src.hasLine || src.hasPoly || src.hasPoint) {
                                    src.styleAble = true;
                                }
                                me.set('loaded', true);


                            }, function (err) {
                                me.error = true;
                                me.errorMessage = err.status;
                                me.set('loaded', true);
                            });
                    },
                    strategy: loadingstrategy.all
                });
                return src;
            }

            function createVectorSourceFromFeatures(srs, options) {
                var src = new Vector({
                    projection: srs,
                    features: options.features
                });

                src.hasLine = false;
                src.hasPoly = false;
                src.hasPoint = false;
                angular.forEach(src.getFeatures(), function (f) {
                    if (f.getGeometry()) {
                        switch (f.getGeometry().getType()) {
                            case 'LineString' || 'MultiLineString':
                                src.hasLine = true;
                                break;
                            case 'Polygon' || 'MultiPolygon':
                                src.hasPoly = true;
                                break;
                            case 'Point' || 'MultiPoint':
                                src.hasPoint = true;
                                break;
                        }
                    }
                })

                if (src.hasLine || src.hasPoly || src.hasPoint) {
                    src.styleAble = true;
                }

                return src;
            }
            /**
            * (PRIVATE) Zoom to selected vector layer
            * @memberof hs.addLayers
            * @function zoomToVectorLayer
            * @param {ol.Layer} lyr New layer
            */
            function zoomToVectorLayer(lyr) {
                layoutService.setMainPanel('layermanager');
                lyr.getSource().on('change', function () { //Event needed because features are loaded asynchronously
                    var extent = lyr.getSource().getExtent();
                    if (extent != null) OlMap.map.getView().fit(extent, OlMap.map.getSize());
                });
            }

            me.checkUrlParamsAndAdd = function () {
                var title = decodeURIComponent(permalink.getParamValue('title')) || 'Layer';
                var abstract = decodeURIComponent(permalink.getParamValue('abstract'));

                if (permalink.getParamValue('geojson_to_connect')) {
                    var url = permalink.getParamValue('geojson_to_connect');
                    var type = 'geojson';
                    if (url.indexOf('gpx') > 0) type = 'gpx';
                    if (url.indexOf('kml') > 0) type = 'kml';
                    var lyr = me.add(type, url, title, abstract, false, 'EPSG:4326');
                    zoomToVectorLayer(lyr);
                }

                if (permalink.getParamValue('kml_to_connect')) {
                    var url = permalink.getParamValue('kml_to_connect');
                    var lyr = me.add('kml', url, title, abstract, true, 'EPSG:4326');
                    zoomToVectorLayer(lyr);
                }
            }

            var dragAndDrop = new DragAndDrop({
                formatConstructors: [
                    GPX,
                    GeoJSON,
                    IGC,
                    KML,
                    TopoJSON
                ]
            });

            OlMap.loaded().then(map => {
                map.addInteraction(dragAndDrop);
                me.checkUrlParamsAndAdd()
            })

            dragAndDrop.on('addfeatures', function (event) {
                if (event.features.length > 0) {
                    var f = new GeoJSON();
                    //TODO Saving to statusmanager should probably be done with statusmanager component throught events
                    var url = '';
                    try {
                        url = statusManagerService.endpointUrl();
                    } catch (ex) { }
                    if (console) console.info(url, config);
                    var options = {};
                    options.features = event.features;

                    $http({
                        url: url,
                        method: 'POST',
                        data: JSON.stringify({
                            project: config.project_name,
                            title: event.file.name,
                            request: 'saveData',
                            dataType: "json",
                            data: f.writeFeatures(event.features, {
                                dataProjection: 'EPSG:4326',
                                featureProjection: OlMap.map.getView().getProjection().getCode()
                            })
                        })
                    }).then(function (response) {
                        var data = {};
                        data.url = url + "?request=loadData&id=" + response.data.id;
                        if (console) console.info(data.url, response.data);
                        data.title = event.file.name;
                        data.projection = event.projection;
                        var lyr = me.add('geojson', decodeURIComponent(data.url), data.title || 'Layer', '', true, data.projection, options);
                    }, function (e) {
                        if (console) console.warn(e);
                        var data = {};
                        data.title = event.file.name;
                        data.projection = event.projection;
                        var lyr = me.add('geojson', undefined, data.title || 'Layer', '', true, data.projection, options);
                    });
                }
            });
        }
    ])

    /**
    * @memberof hs.addLayersVector
    * @ngdoc controller
    * @name hs.addLayersVector.controller
    */
    .controller('hs.addLayersVector.controller', ['$scope', 'hs.map.service', 'hs.styles.service', 'hs.addLayersVector.service', 'Core', 'hs.layout.service',
        function ($scope, OlMap, styles, service, Core, layoutService) {
            $scope.srs = 'EPSG:4326';
            $scope.title = "";
            $scope.extract_styles = false;

            /**
            * Handler for adding nonwms service, file in template.
            * @memberof hs.addLayersVector.controller
            * @function add
            */
            $scope.add = function () {
                service.add($scope.type, $scope.url, $scope.title, $scope.abstract, $scope.extract_styles, $scope.srs);
                layoutService.setMainPanel('layermanager');
            }
        }
    ]);
