import 'map';
import Feature from 'ol/Feature';
import {transform} from 'ol/proj';
import {Polygon} from 'ol/geom';

/**
 * @namespace hs.wirecloud
 * @memberOf hs
 */
angular.module('hs.wirecloud', ['hs', 'hs.map'])

    .service("hs.wirecloud.service", ['$rootScope', 'hs.map.service', 'config',
        function ($rootScope, OlMap, config, default_layers) {
            var view = OlMap.map.getView();
            if (console) console.log('Wirecloud interface loaded');
            if (typeof MashupPlatform !== 'undefined' && angular.isDefined(config.default_layers)) {
                var extent_layer = config.default_layers[2];
                $rootScope.$on('browserurl.updated', function (event) {
                    var center = view.getCenter();
                    center = transform(center, view.getProjection(), 'EPSG:4326');
                    MashupPlatform.wiring.pushEvent("center_event", center[0] + ', ' + center[1]);
                });
                MashupPlatform.wiring.registerCallback("center_slot", function (data) {
                    if (console) console.log("center_slot", data);
                    view.setCenter([parseFloat(data.split(",")[0]), parseFloat(data.split(",")[1])]);
                });
                MashupPlatform.wiring.registerCallback("draw_extent_slot", function (data) {
                    if (console) console.log("draw_extent_slot", data);
                    var b = data.split(",");
                    var first_pair = [parseFloat(b[0]), parseFloat(b[1])]
                    var second_pair = [parseFloat(b[2]), parseFloat(b[3])];
                    first_pair = transform(first_pair, 'EPSG:4326', view.getProjection());
                    second_pair = transform(second_pair, 'EPSG:4326', view.getProjection());
                    var extent = [first_pair[0], first_pair[1], second_pair[0], second_pair[1]];
                    view.fit(extent, OlMap.map.getSize());
                    extent_layer.getSource().clear();
                    var attributes = {};
                    attributes.geometry = Polygon.fromExtent(extent);
                    extent_layer.getSource().addFeatures([new Feature(attributes)]);
                });
                MashupPlatform.wiring.registerCallback("location_info_slot", function (data) {
                    if (console) console.log("location_info_slot", data)
                });
            } else return;
        }
    ])

    .run(['hs.wirecloud.service', function (WireCloud) { // instance-injector
        //Gets executed after service is loaded
    }]);
