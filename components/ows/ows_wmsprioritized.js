define(['angular'], 
       
       function (angular) {
angular.module('hs.ows.wmsprioritized', [])
    .controller('OwsWmsPrioritized', ['$scope', 'OlMap', '$http',
        function($scope, OlMap, $http) {
            $scope.prio_layer = null;
            $scope.amenities = [ 
              {title:"arts_centre", priority:1},  
              {title:"atm", priority:1},
              {title:"bank", priority:1},
              {title:"bar", priority:1},
              {title:"bicycle_rental", priority:1},
              {title:"bureau_de_change", priority:1},
              {title:"cafe", priority:1},
              {title:"car_rental", priority:1},
              {title:"cinema", priority:1},
              {title:"club", priority:1},
              {title:"embassy", priority:1},
              {title:"fountain", priority:1},
              {title:"hospital", priority:1},
              {title:"hotel", priority:1},
              {title:"hostel", priority:1},
              {title:"museum", priority:1},
              {title:"parking", priority:1},
              {title:"pharmacy", priority:1},
              {title:"place_of_worship", priority:1},
              {title:"post_office", priority:1},
              {title:"restaurant", priority:1},
              {title:"shop", priority:1},
              {title:"theatre", priority:1},
              {title:"toilets", priority:1}
            ];
            $scope.add = function(){
                $http.get("/wwwlibs/create_prio_mapfile.php?priorities="+window.escape(JSON.stringify($scope.amenities))).success(function(){
                    if($scope.prio_layer) OlMap.map.removeLayer($scope.prio_layer);
                    $scope.prio_layer = new ol.layer.Tile({
                        title: "Weighted wms",
                        source: new ol.source.TileWMS({
                            url: "/cgi-bin/mapserv?map=/data/www/wwwlibs/here.map",
                            params: {
                                LAYERS: "osm_amenitypoint",
                                INFO_FORMAT: undefined,
                                r: Math.random()
                            },
                        })
                    });

                    OlMap.map.addLayer($scope.prio_layer);
                }
                );
                                
                //console.log("http://ha.isaf2014.info/wwwlibs/create_prio_mapfile.php?priorities="+window.escape(JSON.stringify($scope.amenities)));                
            }
        }
    ]);
       })