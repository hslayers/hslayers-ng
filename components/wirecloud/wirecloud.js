define(['angular', 'app', 'map', 'ol'],

    function(angular, app, map, ol) {
        angular.module('hs.wirecloud', ['hs', 'hs.map'])

        .service("WireCloud", ['$rootScope', 'OlMap', 'wirecloud_data_consumer',
            function($rootScope, OlMap, wirecloud_data_consumer) {
                var view = OlMap.map.getView();
                if (console) console.log('Wirecloud interface loaded');
                if (typeof MashupPlatform !== 'undefined') {
                    $rootScope.$on('browserurl.updated', function(event) {
                        var center = view.getCenter();
                        center = ol.proj.transform(center, view.getProjection(), 'EPSG:4326');
                        MashupPlatform.wiring.pushEvent("center_event", center[0] + ', ' + center[1]);
                    });
                    MashupPlatform.wiring.registerCallback("map_info_slot", function(data) {
                        console.log("map_info_slot", data)
                    });
                    MashupPlatform.wiring.registerCallback("location_info_slot", function(data) {
                        console.log("location_info_slot", data)
                    });
                } else return;
            }
        ])

        .run(function(WireCloud) { // instance-injector
            //Gets executed after service is loaded
        });
    })
