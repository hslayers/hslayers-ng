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
                            var upload_date = panoramio.photos[i].upload_date;
                            var owner_name = panoramio.photos[i].owner_name;
                            var photo_id = panoramio.photos[i].photo_id;
                            var longitude = panoramio.photos[i].longitude;
                            var latitude = panoramio.photos[i].latitude;
                            var pheight = panoramio.photos[i].height;
                            var pwidth = panoramio.photos[i].width;
                            var photo_title = panoramio.photos[i].photo_title;
                            var owner_url = panoramio.photos[i].owner_url;
                            var owner_id = panoramio.photos[i].owner_id;
                            var photo_file_url = panoramio.photos[i].photo_file_url;
                            var photo_url = panoramio.photos[i].photo_url;

                            var attributes = {
                                    geometry: new ol.geom.Point(ol.proj.transform([longitude, latitude], 'EPSG:4326', 'EPSG:3857')),
                                    'upload_date': upload_date,
                                    'owner_name': owner_name,
                                    'photo_id': photo_id,
                                    'longitude': longitude,
                                    'latitude': latitude,
                                    'pheight': pheight,
                                    'pwidth': pwidth,
                                    'pheight': pheight,
                                    'photo_title': photo_title,
                                    'owner_url': owner_url,
                                    'owner_id': owner_id,
                                    'photo_file_url': photo_file_url,
                                    'photo_url': photo_url,
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
                        var b = ol.proj.transform(map.getView().calculateExtent(map.getSize()), 'EPSG:3857', 'EPSG:4326'); // bounds
                        var url = window.escape('http://www.panoramio.com/map/get_panoramas.php?order=popularity&set=full&from=0&to=80&minx=' + b[0] + '&miny=' + b[1] + '&maxx=' + b[2] + '&maxy=' + b[3] + '&size=thumbnail');
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
