export default ['hs.map.service', 'Core', '$timeout', 'config', '$compile', '$injector', 'hs.layout.service',
    function (OlMap, Core, $timeout, config, $compile, $injector, layoutService) {
        return {
            template: config.design == 'md' ? require('components/layout/partials/layoutmd.html') : require('components/layout/partials/layout.html'),
            link: function (scope, element) {
                layoutService.contentWrapper = element[0].querySelector('.hs-content-wrapper');
                layoutService.layoutElement = element[0];
                try {
                    if (angular.module('hs.cesium')) {
                        if (element[0].querySelector('.hs-page-content')) {
                            let cesiumDir = $compile('<div hs.cesium.directive ng-controller="hs.cesium.controller"></div>')(scope);
                            element[0].querySelector('.hs-page-content').appendChild(cesiumDir[0]);
                        }
                    }
                } catch (err) { /* failed to require */ }


                Core.init(element, {
                    innerElement: '.hs-map-container'
                });

                //Hack - flex map container was not initialized when map loaded 
                var container = layoutService.contentWrapper.querySelector('.hs-map-container');
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
                        $timeout(_ => {
                            if(window.innerWidth < 600){
                                var viewport = document.querySelector('meta[name="viewport"]');
                                viewport.setAttribute("content", "width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no");
                            }
                        }, 500);
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