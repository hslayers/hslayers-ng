import 'components/styles/styles.module';
import 'save-map.module';

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
                    for (let i = 0; i < changeEvent.target.files.length; i++) {
                        let file = changeEvent.target.files[i];
                        let reader = new FileReader();
                        reader.onload = function (loadEvent) {
                            scope.$apply(function () {
                                scope.fileread.push({
                                    name: file.name,
                                    type: file.type,
                                    content: loadEvent.target.result
                                });
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
            let me = this;

            /**
            * Load nonwms OWS data and create layer
            * @memberof hs.addLayers
            * @function add
            * @param {Object} endpoint Layman endpoint description (url, name, user)
            * @param {Array} files Array of shp files (shp, dbf, shx)
            * @param {String} name Name of new layer
            * @param {String} title Title of new layer
            * @param {String} abstract Abstract of new layer
            * @param {String} srs EPSG code of selected projection (eg. "EPSG:4326")
            * @param {Array} sld Array of sld files
            */
            me.add = function (endpoint, files, name, title, abstract, srs, sld) {
                return new Promise((resolve, reject) => {
                    const formdata = new FormData();
                    files.forEach(file => {
                        formdata.append('file',
                            new Blob(
                                [file.content],
                                { type: file.type }
                            ),
                            file.name
                        );
                    })
                    sld.forEach(file => {
                        formdata.append('sld',
                            new Blob(
                                [file.content],
                                { type: file.type }
                            ),
                            file.name
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
            $scope.sld = null;
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

            if ($scope.endpoints.length > 0)
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
                service.add($scope.endpoint, $scope.files, $scope.name, $scope.title, $scope.abstract, $scope.srs, $scope.sld).then(data => {
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
