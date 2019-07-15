export default ['hs.map.service', 'Core', '$timeout', 'config', '$compile', '$injector',
    function (OlMap, Core, $timeout, config, $compile, $injector) {
        return {
            template: config.design == 'md' ? require('components/layout/partials/layoutmd.html') : require('components/layout/partials/layout.html'),
            link: function (scope, element) {
                try {
                    if (angular.module('hs.cesium')) {
                        if (element[0].querySelector('.page-content')) {
                            let cesiumDir = $compile('<div hs.cesium.directive ng-controller="hs.cesium.controller"></div>')(scope);
                            element[0].querySelector('.page-content').appendChild(cesiumDir[0]);
                        }
                    }
                } catch (err) { /* failed to require */ }


                Core.init(element, {
                    innerElement: '#map-container'
                });

                //Hack - flex map container was not initialized when map loaded 
                var container = document.getElementById('map-container');
                if (container) {
                    if (container.clientHeight === 0) {
                        containerCheck();
                    }

                    function containerCheck() {
                        $timeout(function () {
                            if (container.clientHeight != 0) scope.$emit("Core_sizeChanged");
                            else containerCheck();
                        }, 100);
                    }
                }

                if (angular.isUndefined(config.importCss) || config.importCss) {
                    if (config.design == 'md') {
                        require('angular-material/angular-material.css');
                        require('angular-material-bottom-sheet-collapsible/bottomSheetCollapsible.css');
                    } else {
                        if (config.useIsolatedBootstrap) {
                            require('bootstrap/dist/css/bootstrap.isolated.css')
                        } else {
                            require('bootstrap/dist/css/bootstrap.css')
                        }
                    }
                    require('css/app.css');
                    if (!!window.cordova) {
                        require('css/mobile.css')
                    }
                    require('css/whhg-font/css/whhg.css')
                }
            }
        };
    }
]