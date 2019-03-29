define(['angular', 'ol', 'map', 'd3'],

    function(angular, ol, map) {
        angular.module('hs.widgets.chart_panel', ['hs.map'])
            .service('chart_panel_service', ['hs.map.service', function(OlMap) {
                var me = {};

                return me;
            }])
            .directive('chartpanel', function() {
                return {
                    templateUrl: './partials/template.html',
                    link: function(scope, element) {
                        var link = document.createElement("link");
                        link.type = "text/css";
                        link.rel = "stylesheet";
                        link.href = hsl_path + 'examples/webgl_viz2/chart_panel/partials/style.css';
                        document.getElementsByTagName("head")[0].appendChild(link);
                    }
                };
            })

        .controller('ChartPanel', ['$scope', 'hs.map.service', 'chart_panel_service',
            function($scope, OlMap, chart_panel_service) {

            }
        ]);

    });
