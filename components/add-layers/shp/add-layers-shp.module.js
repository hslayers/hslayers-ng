import { DragAndDrop } from 'ol/interaction';
import { GPX, IGC, KML, TopoJSON, GeoJSON } from 'ol/format';
import SparqlJson from 'hs.source.SparqlJson'
import WfsSource from 'hs.source.Wfs'
import 'components/styles/styles.module';
import * as loadingstrategy from 'ol/loadingstrategy';
import { transform, transformExtent, get as getProj } from 'ol/proj';
import { Vector } from 'ol/source';
import 'save-map.module';
import VectorLayer from 'ol/layer/Vector';

/**
 * @namespace hs.addLayersShp
 * @memberOf hs
 */
angular.module('hs.addLayersShp', ['hs.styles', 'hs.widgets', 'hs.save-map', 'hs.addLayersWms'])
    /**
    * @memberof hs.ows
    * @ngdoc directive
    * @name hs.addLayersShp
    * @description TODO
    */
    .directive('hs.addLayersShp', ['config', function (config) {
        return {
            template: require('./add-shp-layer.directive.html')
        };
    }])

    .directive("fileread", [function () {
        return {
            scope: {
                fileread: "="
            },
            link: function (scope, element, attributes) {
                element.bind("change", function (changeEvent) {
                    scope.fileread = [];
                    for (var i = 0; i < changeEvent.target.files.length; i++) {
                        let file = changeEvent.target.files[i];
                        var reader = new FileReader();
                        reader.onload = function (loadEvent) {
                            scope.$apply(function () {
                                scope.fileread.push({ name: file.name, type: file.type, content: loadEvent.target.result });
                            });
                        }
                        reader.readAsArrayBuffer(file);
                    }

                });
            }
        }
    }])

    /**
    * @memberof hs.addLayersShp
    * @ngdoc service
    * @name hs.addLayersShp.service
    * @description Service handling adding nonwms OWS services or files. Handles also drag and drop addition.
    */
    .service('hs.addLayersShp.service', ['config', 'Core', '$rootScope', 'hs.map.service', 'hs.styles.service', 'hs.utils.service', '$http', 'hs.statusManagerService', 'hs.permalink.urlService', 'hs.layout.service',
        function (config, Core, $rootScope, OlMap, styles, utils, $http, statusManagerService, permalink, layoutService) {
            var me = this;

            /**
            * Load nonwms OWS data and create layer
            * @memberof hs.addLayers
            * @function add
            * @param {String} type Type of data to load (supports Kml, Geojson, Wfs and Sparql) 
            * @param {String} url Url of data/service localization
            * @param {String} name Name of new layer
            * @param {String} title Title of new layer
            * @param {String} abstract Abstract of new layer
            * @param {String} srs EPSG code of selected projection (eg. "EPSG:4326")
            * @param {Object} options Other options  
            */
            me.add = function (endpoint, files, name, title, abstract, srs) {
                return new Promise((resolve, reject) => {
                    var formdata = new FormData();
                    files.forEach(file => {
                        formdata.append('file',
                            new Blob([file.content],
                                { type: file.type }), file.name
                        );
                    })
                    formdata.append('name', name);
                    formdata.append('title', title);
                    formdata.append('abstract', abstract);
                    formdata.append('crs', srs);
                    $http({
                        url: `${endpoint.url}/rest/${endpoint.user}/layers?${Math.random()}`,
                        method: 'POST',
                        data: formdata,
                        transformRequest: angular.identity,
                        headers: { 'Content-Type': undefined }
                    })
                        .then(function (response) {
                            if (response.data && response.data.length > 0) {
                                resolve(response.data)
                            } else {
                                reject(response.data)
                            }
                        }, function (err) {
                            reject(err.data)
                        });
                })
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
        }
    ])

    /**
    * @memberof hs.addLayersShp
    * @ngdoc controller
    * @name hs.addLayersShp.controller
    */
    .controller('hs.addLayersShp.controller', ['$scope', 'hs.map.service', 'hs.styles.service', 'hs.addLayersShp.service', 'Core', 'hs.layout.service', 'config', 'hs.laymanService', 'hs.addLayersWms.addLayerService',
        function ($scope, OlMap, styles, service, Core, layoutService, config, laymanService, addLayerService) {
            $scope.srs = 'EPSG:4326';
            $scope.title = "";
            $scope.extract_styles = false;
            $scope.files = null;
            $scope.errorDetails = {};
            $scope.loaderImage = require('img/ajax-loader.gif');

            $scope.endpoints = (config.datasources || []).filter(ds => ds.type == 'layman').map(
                ds => {
                    return {
                        type: 'layman',
                        name: 'Layman',
                        url: ds.url,
                        user: ds.user
                    }
                });

            if($scope.endpoints.length > 0) 
                $scope.endpoint = $scope.endpoints[0];

            function describeNewLayer(endpoint, layerName) {
                return new Promise((resolve, reject) => {
                    laymanService.describeLayer(endpoint, layerName)
                        .then(descriptor => {
                            if (['STARTED', 'PENDING', 'SUCCESS'].indexOf(descriptor.wms.status) > -1) {
                                setTimeout(function () {
                                    describeNewLayer(endpoint, layerName)
                                        .then(response => resolve(response))
                                }, 2000);
                            } else {
                                resolve(descriptor)
                            }
                        });
                })
            }

            /**
            * Handler for adding nonwms service, file in template.
            * @memberof hs.addLayersShp.controller
            * @function add
            */
            $scope.add = function () {
                $scope.loading = true;
                service.add($scope.endpoint, $scope.files, $scope.name, $scope.title, $scope.abstract, $scope.srs).then(data => {
                    describeNewLayer($scope.endpoint, $scope.name)
                    .then(descriptor => {
                        addLayerService.addService(descriptor.wms.url, undefined, $scope.name);
                        $scope.loading = false;
                        layoutService.setMainPanel('layermanager');
                    })
                    $scope.resultCode = 'success';
                }).catch(err => {
                    $scope.loading = false;
                    $scope.resultCode = 'error';
                    $scope.errorMessage = err.message;
                    $scope.errorDetails = err.detail;
                });

            }
        }
    ]);
