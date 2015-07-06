define(['angular', 'ol', 'app', 'map'],

    function(angular, ol, app, map) {
        angular.module('hs.panoramio', ['hs', 'hs.map'])
            .directive('panoramio', function() {
                function link(scope, element, attrs) {
                    if (attrs.value) {
                        if (attrs.attribute == 'photo_file_url') {
                            element.html(angular.element('<img>').attr({
                                src: attrs.value
                            }));
                        } else {
                            if (attrs.value.indexOf('http') == 0) {
                                var el = angular.element('<a>').attr({
                                    target: '_blank',
                                    href: attrs.value
                                }).html(attrs.value);
                                element.html(el);
                            } else {
                                element.html(attrs.value.toString());
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
                            var max_pop = 0;
                            var max_pop_i = 0;
                            for (var i = 0; i < feature.get('features').length; i++) {
                                var pop = feature.get('features')[i].get('popularity');
                                if (pop > max_pop) {
                                    max_pop = pop;
                                    max_pop_i = i;
                                }
                            }
                            var style = [new ol.style.Style({
                                image: feature.get('features')[max_pop_i].getStyle()[0].getImage(),
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
                    changed();


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
                                popularity: i,
                                hstemplate: 'panoramio'
                            };
                            
                            var feature = new ol.Feature(attributes);
                            var xhr = new XMLHttpRequest(),
            blob,
            fileReader = new FileReader();

        xhr.open("GET", attributes.photo_file_url, true);
        // Set the responseType to arraybuffer. "blob" is an option too, rendering BlobBuilder unnecessary, but the support for "blob" is not widespread enough yet
        xhr.responseType = "arraybuffer";

        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                // Create a blob from the response
                blob = new Blob([xhr.response], {type: "image/png"});

                // onload needed since Google Chrome doesn't support addEventListener for FileReader
                fileReader.onload = function (evt) {
                    // Read out file contents as a Data URL
                    var result = evt.target.result;
                    // Set image src to Data URL
                    //rhino.setAttribute("src", result);
                    // Store Data URL in localStorage
                    try {
                        //localStorage.setItem("rhino", result);
                    }
                    catch (e) {
                        console.log("Storage failed: " + e);
                    }
                };
                // Load blob as Data URL
                fileReader.readAsDataURL(blob);
            }
        }, false);
        // Send XHR
        xhr.send();
            
                            
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
                        var b = ol.proj.transformExtent(map.getView().calculateExtent(map.getSize()), map.getView().getProjection(), 'EPSG:4326'); // bounds
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
