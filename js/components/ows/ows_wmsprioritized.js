angular.module('hs.ows.wmsprioritized', [])
    .controller('OwsWmsPrioritized', ['$scope', 'OlMap', '$http',
        function($scope, OlMap, $http) {
            $scope.amenities = [{title:"restaurant", priority:5}, {title:"club", priority:10},
              {title:"bar", priority:10},
              {title:"cafe", priority:10},
              {title:"bicycle_rental", priority:10},
              {title:"car_rental", priority:10},
              {title:"atm", priority:10},
              {title:"bank", priority:10},
              {title:"hospital", priority:10},
              {title:"pharmacy", priority:10},
              {title:"parking", priority:10},
              {title:"bureau_de_change", priority:10},
              {title:"cinema", priority:10},
              {title:"theatre", priority:10},
              {title:"embassy", priority:10},
              {title:"post_office", priority:10},
              {title:"place_of_worship", priority:10},
              {title:"toilets", priority:10},
              {title:"fountain", priority:10},
              {title:"arts_centre", priority:10}
            ];
            $scope.add = function(){
                $http.get("http://ha.isaf2014.info/wwwlibs/create_prio_mapfile.php?priorities="+window.escape(JSON.stringify($scope.amenities))).success(function(){
                var new_layer = new ol.layer.Tile({
                    title: "Weighted wms",
                    source: new ol.source.TileWMS({
                        url: "http://ha.isaf2014.info/cgi-bin/mapserv?map=/data/www/wwwlibs/here.map",
                        params: {
                            LAYERS: "osm_amenitypoint",
                            INFO_FORMAT: undefined,
                        },
                    })
                });

                OlMap.map.addLayer(new_layer);
                  
                }
                );
                                
                //console.log("http://ha.isaf2014.info/wwwlibs/create_prio_mapfile.php?priorities="+window.escape(JSON.stringify($scope.amenities)));                
            }
        }
    ]);