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
                    import('ol/ol.css');
                    if (config.design == 'md') {
                        import('angular-material/angular-material.css');
                        import('angular-material-bottom-sheet-collapsible/bottomSheetCollapsible.css');
                    } else {
                        if (config.useIsolatedBootstrap) {
                            import('bootstrap/dist/css/bootstrap.isolated.css')
                        } else {
                            import('bootstrap/dist/css/bootstrap.css')
                        }
                    }
                    import('css/app.css');
                    if (!!window.cordova) {
                        import('css/mobile.css')
                    }
                    import('css/whhg-font/css/whhg.css')
                }
            }
        };
    }
]