define(['angular', 'ol', 'dc', 'map'],

    function(angular, ol, dc) {
        var module = angular.module('hs.feature_crossfilter', ['hs.map'])
            .directive('featureCrossfilter', function() {
                return {
                    templateUrl: hsl_path + 'components/feature_crossfilter/partials/f_crossfilter.html',
                    link: function(scope, element) {

                    }
                };
            })
        .service('feature_crossfilter', [function(){
            return {
                makeCrossfilterDimensions : function(source, attributes){
                    console.log('asd');
                    var facts = crossfilter(source.getFeatures());
                    var tmp = [];
                    for (var attr_i in attributes) {
                        var attr = attributes[attr_i];    
                        var total = facts.dimension( function(feature) { 
                            console.log(feature.get(attr)+"s");
                            return feature.get(attr);
                        });
                        var groupsByTotal = total.group().reduceCount( function(feature) { 
                            return feature.get(attr); 
                        });
                        tmp.push({dimension: total, grouping: groupsByTotal});
                    }
                    
                    return tmp;
                    // caur konsoli: var a = angular.element('*[ng-app]').injector().get('hsService');
                }
            };
        }])
        .controller('FeatureCrossfilter', ['$scope', 'OlMap', 'feature_crossfilter',
            function($scope, OlMap, feature_crossfilter) {
                var map = OlMap.map;

                $scope.ajax_loader = hsl_path + 'components/lodexplorer/ajax-loader.gif';
                $scope.loading = false;
                $scope.groupings = [];
                $scope.groupings.push({name: "Category"});
                if (!$scope.$$phase) $scope.$digest();
                
                setTimeout(function(){
                    var dimAndGroups = feature_crossfilter.makeCrossfilterDimensions(OlMap.map.getLayers().item(2).getSource(), ["http://gis.zcu.cz/poi#category_osm"]);
                    var pies = [];
                    
                    var chart = dc.rowChart('#fc_chart'+'Category');
                                chart.width($("#f_crossfilter_data_panel").width() - 35)
                                    .height(dimAndGroups[0].grouping.size() * 23 + 40).labelOffsetY(12)
                                    .dimension(dimAndGroups[0].dimension) // set dimension
                                    .group(dimAndGroups[0].grouping) // set group
                                pies.push(chart);
                    dc.renderAll();
                }, 4000);
                
                $scope.$on('infopanel.updated', function(event) {});

                $scope.$emit('scope_loaded', "FeatureCrossfilter");
            }
        ]);

    })
