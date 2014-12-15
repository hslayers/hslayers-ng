define(['angular', 'map', 'app'],

    function(angular) {
        var mod = angular.module('hs.panoramio', ['hs.map'])
            .service("PanoramioPictures", ['OlMap', '$http', 'default_layers',
                function(OlMap, $http, default_layers) {
                    var map = OlMap.map;
                    var src = new ol.source.Vector();
                    var csrc = new ol.source.Cluster({
                        distance: 90,
                        source: src
                    });
                    var lyr = null;
                    var me = this;
                    var view = OlMap.map.getView();

                    lyr = new ol.layer.Vector({
                        title: "Panoramio pictures",
                        show_in_manager: true,
                        source: csrc,
                        style: function(feature, resolution) {
                            return feature.get('features')[0].getStyle()
                        }
                    });

                    default_layers.push(lyr);

                    var timer = null;

                    var changed = function(e) {
                        if (timer != null) clearTimeout(timer);
                        timer = setTimeout(function() {
                            me.update(e)
                        }, 500);
                    }

                    OlMap.map.getView().on('change:center', changed);
                    OlMap.map.getView().on('change:resolution', changed);


                    this.featuresReceived = function(panoramio) {
                        var features = [];
                        for (var i = 0; i < panoramio.photos.length; i++) {
                            var p = panoramio.photos[i];
                            var attributes = {
                                    geometry: new ol.geom.Point(ol.proj.transform([p.longitude, p.latitude], 'EPSG:4326', map.getView().getProjection())),
                                    upload_date: p.upload_date,
                                    owner_name: p.owner_name,
                                    photo_id: p.photo_id,
                                    longitude: p.longitude,
                                    latitude: p.latitude,
                                    pheight: p.height,
                                    pwidth: p.width,
                                    photo_title: p.photo_title,
                                    owner_url: p.owner_url,
                                    owner_id: p.owner_id,
                                    photo_file_url: p.photo_file_url,
                                    photo_url: p.photo_url,
                                } //end attributes
                            var feature = new ol.Feature(attributes);
                            feature.setStyle([new ol.style.Style({
                                image: new ol.style.Icon({
                                    src: feature.get('photo_file_url')
                                })
                            })])

                            features.push(feature);
                        }
                        src.clear();
                        src.addFeatures(features);
                    }
                    this.update = function(url) {
                        var b = ol.proj.transform(map.getView().calculateExtent(map.getSize()), map.getView().getProjection(), 'EPSG:4326'); // bounds
                        var limit = Math.floor($(map.getViewport()).width()*$(map.getViewport()).height() / 22280 * 1.2);
                        var url = window.escape('http://www.panoramio.com/map/get_panoramas.php?order=popularity&set=full&from=0&to='+limit+'&minx=' + b[0] + '&miny=' + b[1] + '&maxx=' + b[2] + '&maxy=' + b[3] + '&size=thumbnail');
                        $.ajax({
                            url: "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + url,
                            cache: false,
                            success: this.featuresReceived
                        });
                    };
                }
            ])

        .run(function(PanoramioPictures) { // instance-injector
            //Gets executed after service is loaded
        });
    })
