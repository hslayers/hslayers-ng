if (typeof hslMin != 'undefined') {
    if (hslMin == true) hslMin = '.min';
    else hslMin = '';
} else hslMin = '';
console.log(hslMin);

require.config({
    paths: {
        matSearch: hsl_path + 'examples/liberecMaterial/materialComponents/matSearch',
        mainToolbar: hsl_path + 'examples/liberecMaterial/materialComponents/mainToolbar',
        bottomToolbar: hsl_path + 'examples/liberecMaterial/materialComponents/bottomToolbar',
        sidepanel: hsl_path + 'examples/liberecMaterial/materialComponents/sidepanel',
        matAddLayer: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/addLayer',
        matBasemap: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/basemap',
        matLayerManager: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/layerManager',
        matShareMap: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/shareMap',
        matMeasure: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/matMeasure',
        matQuery: hsl_path + 'examples/liberecMaterial/materialComponents/panelContents/queryResult'
    },
    shim: {},
    priority: []
});

define(['angular', 'core', 'ngMaterial'],
    function (angular) {
        angular.module('hs.material.core', ['hs.core'])
            .controller("MatCore", ['$scope', '$window', 'hs.map.service', 'gettextCatalog', 'config', '$templateCache', '$timeout', '$mdSidenav', '$interval', 'hs.material.sidepanel.service',
                function ($scope, $window, OlMap, gettextCatalog, config, $templateCache, $timeout, $mdSidenav, $interval, Sidenav) {

                    $scope.toogleSidenav = function(id){
                        Sidenav.toogleSidenav(id);
                    }

                    $scope.isSidenavOpened = function(id){
                        return Sidenav.isSidenavOpened(id);
                    }

                    $scope.changeZoom = function (zoomIn) {
                        var view = OlMap.map.getView();
                        var zoom = view.getZoom();
                        if (zoomIn) {
                            if (view.getMinZoom() < zoom) view.setZoom(zoom + 1);
                        } else {
                            if (view.getMaxZoom() > zoom) view.setZoom(zoom - 1);
                        }
                    }

                    $scope.resetMap = function () {
                        OlMap.resetView();
                    }

                    $scope.getPosition = function () {
                        var geolocation = new ol.Geolocation({
                            projection: OlMap.map.getView().getProjection()
                        });
                        var location = geolocation.getPosition();
                        if (angular.isDefined(location)) OlMap.map.getView().setCenter(location);
                    }

                    navigator.permissions && navigator.permissions.query({
                        name: 'geolocation'
                    }).then(function (PermissionStatus) {
                        if (PermissionStatus.state == 'granted') {
                            console.log("a");
                        } else {
                            console.log("b");
                        }
                    })

                    $scope.$on('map.loaded', function () {
                        angular.forEach(OlMap.map.getControls(), function (control) {
                            OlMap.map.removeControl(control);
                        })
                    })
                }])
    })