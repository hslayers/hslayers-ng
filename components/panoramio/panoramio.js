define(['angular', 'map', 'app'],

    function(angular) {
        angular.module('hs.panoramio', ['hs.map'])
            .directive('panoramio', function() {
                function link(scope, element, attrs) {
                    if (attrs.value) {
                        if (attrs.attribute == 'photo_file_url') {
                            element.html(angular.element('<img>').attr({src: attrs.value}));
                        } else {
                            if (attrs.value.indexOf('http') == 0) {
                                var el = angular.element('<a>').attr({target: '_blank', href: attrs.value}).html(attrs.value);
                                element.html(el);
                            } else {
                                element.html(attrs.value);
                            }
                        }
                    } else {
                        if (attrs.attribute != 'photo_file_url') {
                            element.html(attrs.attribute);
                        }
                    }
                }

                return {
                    link: link
                };
            })
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
                            var text = null;
                            if (feature.get('features').length > 1) {
                                text = new ol.style.Text({
                                    text: feature.get('features').length.toString(),
                                    fill: new ol.style.Fill({
                                        color: '#fff'
                                    }),
                                    stroke: new ol.style.Stroke({
                                        color: '#000'
                                    })
                                })
                            }
                            var style = [new ol.style.Style({
                                image: feature.get('features')[0].getStyle()[0].getImage(),
                                text: text

                            })];
                            return style;
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
                                photo_file_url: p.photo_file_url,
                                Title: p.photo_title,
                                Uploaded: p.upload_date,
                                Link: p.photo_url,
                                'Lon, Lat': p.longitude.toFixed(4) + ' ' + p.latitude.toFixed(4),
                                //pheight: p.height,
                                //pwidth: p.width,
                                Author: p.owner_name,
                                'Owner': p.owner_url,
                                hstemplate: 'panoramio'
                            }
                            var feature = new ol.Feature(attributes);
                            feature.setStyle([new ol.style.Style({
                                image: new ol.style.Icon({
                                    src: feature.get('photo_file_url'),
                                    crossOrigin: 'anonymous'
                                })
                            })])

                            features.push(feature);
                        }
                        src.clear();
                        src.addFeatures(features);
                    }
                    this.update = function(url) {
                        var b = ol.proj.transform(map.getView().calculateExtent(map.getSize()), map.getView().getProjection(), 'EPSG:4326'); // bounds
                        var limit = Math.floor($(map.getViewport()).width() * $(map.getViewport()).height() / 22280 * 1.2);
                        var url = window.escape('http://www.panoramio.com/map/get_panoramas.php?order=popularity&set=full&from=0&to=' + limit + '&minx=' + b[0] + '&miny=' + b[1] + '&maxx=' + b[2] + '&maxy=' + b[3] + '&size=thumbnail');
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
