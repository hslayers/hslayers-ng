/**
 * @namespace hs.panoramio
 * @memberOf hs
 */

define(['angular', 'ol', 'app', 'map'],

    function(angular, ol, app, map) {
        angular.module('hs.panoramio', ['hs', 'hs.map'])

        /**
         * @class hs.panoramio.directive
         * @memberOf hs.panoramio
         * @param {hs.panoramio.service} service
         * @description Directive for formating the attribute table when clicking on a feature (thumbnail). Will be used by the 'query' module
         */
        .directive('hs.panoramio.directive', ['hs.panoramio.service', function(service) {
            return {
                link: function(scope, element, attrs) {
                    if (attrs.value) {
                        if (attrs.attribute == 'photo_file_url') {
                            element.html(angular.element('<img>').attr({
                                src: attrs.value
                            }));
                            var button = angular.element('<button>').attr({
                                class: 'btn btn-default'
                            }).css('float', 'right');


                            /**
                             * @function save
                             * @memberOf hs.panoramio.directive
                             * @description A button click handler which stores the feature which attributes are formated using this directive to the localStorage (attributes and geometry)
                             */
                            var save = function() {
                                service.source.forEachFeature(function(feature) {
                                    if (feature.get('photo_file_url') == attrs.value) {
                                        service.saved_items[attrs.value] = {};
                                        feature.getKeys().forEach(function(key) {
                                            if (key == 'gid') return;
                                            if (key == 'geometry') {
                                                var format = new ol.format.WKT();
                                                service.saved_items[attrs.value][key] = format.writeFeature(feature);
                                                return;
                                            }
                                            service.saved_items[attrs.value][key] = feature.get(key);
                                        });
                                        feature.set('popularity', 100000);
                                        localStorage.setItem('saved_panoramio_features', JSON.stringify(service.saved_items));
                                        service.loadIntoLocalStorage(attrs.value);
                                        button.html('Remove').off('click').on('click', remove);
                                    }
                                })

                            }

                            /**
                             * @function remove
                             * @memberOf hs.panoramio.directive
                             * @description A button click handler which removes the feature which attributes are formated using this directive from the localStorage (attributes and geometry)
                             */
                            var remove = function() {
                                service.source.forEachFeature(function(feature) {
                                    if (feature.get('photo_file_url') == attrs.value) {
                                        delete service.saved_items[attrs.value];
                                        localStorage.setItem('saved_panoramio_features', JSON.stringify(service.saved_items));
                                        localStorage.removeItem('saved_panoramio_image_' + attrs.value);
                                        button.html('Save').off('click').on('click', save);
                                    }
                                })
                            }

                            if (typeof service.saved_items[attrs.value] == 'undefined') {
                                button.html('Save').click(save);
                            } else {
                                button.html('Remove').click(remove);
                            }
                            element.append(button);

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
            };
        }])

        /**
         * @class hs.panoramio.service
         * @memberOf hs.panoramio
         * @param {hs.map.OlMap} OlMap - Service for containing map object
         * @param {array} default_layers - Layer array to which the new panoramio layer will be added. It is later iterated and added to map.
         * @description Service for querying and displaying panoramio pictures
         */
        .service("hs.panoramio.service", ['hs.map.service', 'default_layers',
            function(OlMap, default_layers) {
                var map = OlMap.map;
                var src = new ol.source.Vector();
                var csrc = new ol.source.Cluster({
                    distance: 90,
                    source: src
                });
                var lyr = null;
                var me = this;
                var view = OlMap.map.getView();
                var wkt_format = new ol.format.WKT();
                var timer = null;

                /**
                 * @function getSavedItems
                 * @memberOf hs.panoramio.service
                 * @description Reads the saved features from localStorage and parses that JSON. The functionality of saving is contained in {@link hs.panoramio.panoramio} directive
                 * @returns {object}
                 */
                this.getSavedItems = function() {
                    var saved_items = localStorage.getItem('saved_panoramio_features');
                    if (saved_items == null)
                        return {};
                    else
                        return JSON.parse(saved_items);
                }

                /**
                 * @function loadLocalFeature
                 * @memberOf hs.panoramio.service
                 * @description creates an openlayers feature from json object which was contained in localStorage
                 * @returns {ol.Feature}
                 */
                var loadLocalFeature = function(item, address) {
                    try {
                        var feature = wkt_format.readFeature(item.geometry);
                        angular.forEach(item, function(value, key) {
                            if (key != 'geometry')
                                feature.set(key, value);
                        })
                        feature.set('popularity', 100000);
                        feature.setStyle([new ol.style.Style({
                            image: new ol.style.Icon({
                                src: localStorage.getItem('saved_panoramio_image_' + item.photo_file_url)
                            })
                        })]);
                        return feature;
                    } catch (ex) {
                        return null;
                    }
                }

                /**
                 * @function featuresReceived
                 * @memberOf hs.panoramio.service
                 * @description Ajax callback function executed after panoramio API callback
                 * @param {object} panoramio - List of images, their coordinates and metadata
                 */
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
                            hstemplate: 'hs.panoramio.directive'
                        };

                        var feature = new ol.Feature(attributes);

                        feature.setStyle([new ol.style.Style({
                            image: new ol.style.Icon({
                                src: feature.get('photo_file_url'),
                                crossOrigin: 'anonymous'
                            })
                        })])

                        features.push(feature);
                    }
                    //Load saved items from localStorage
                    angular.forEach(me.saved_items, function(item, address) {
                        var feature = loadLocalFeature(item, address);
                        if (feature) features.push(feature);
                    });
                    src.clear();
                    src.addFeatures(features);
                }

                /**
                 * @function update
                 * @memberOf hs.panoramio.service
                 * @description Requests the most popular images for current extent from Panoramio API. The number of items returned depends on the screen size.
                 */
                this.update = function() {
                    var b = ol.proj.transformExtent(map.getView().calculateExtent(map.getSize()), map.getView().getProjection(), 'EPSG:4326'); // bounds
                    var limit = Math.floor($(map.getViewport()).width() * $(map.getViewport()).height() / 22280 * 1.2);
                    var url = '';
                    if (typeof use_proxy === 'undefined' || use_proxy === true) {
                        url = "/cgi-bin/hsproxy.cgi?toEncoding=utf-8&url=" + window.escape('http://www.panoramio.com/map/get_panoramas.php?order=popularity&set=full&from=0&to=' + limit + '&minx=' + b[0] + '&miny=' + b[1] + '&maxx=' + b[2] + '&maxy=' + b[3] + '&size=thumbnail');
                    } else {
                        url = 'http://www.panoramio.com/map/get_panoramas.php?order=popularity&set=full&from=0&to=' + limit + '&minx=' + b[0] + '&miny=' + b[1] + '&maxx=' + b[2] + '&maxy=' + b[3] + '&size=thumbnail';
                    }
                    $.ajax({
                        url: url,
                        cache: false,
                        success: this.featuresReceived
                    });
                };

                /**
                 * @function loadIntoLocalStorage
                 * @memberOf hs.panoramio.service
                 * @description Loads, serializes and stores an image into localStorage
                 * @param {object} path - URL of image
                 */
                this.loadIntoLocalStorage = function(path) {
                    var xhr = new XMLHttpRequest(),
                        blob,
                        fileReader = new FileReader();

                    xhr.open("GET", path, true);
                    xhr.responseType = "arraybuffer";

                    xhr.addEventListener("load", function() {
                        if (xhr.status === 200) {
                            // Create a blob from the response
                            blob = new Blob([xhr.response], {
                                type: "image/png"
                            });

                            // onload needed since Google Chrome doesn't support addEventListener for FileReader
                            fileReader.onload = function(evt) {
                                var result = evt.target.result;
                                // Set image src to Data URL
                                //rhino.setAttribute("src", result);
                                // Store Data URL in localStorage
                                try {
                                    localStorage.setItem('saved_panoramio_image_' + path, result);
                                } catch (e) {
                                    console.log("Storage failed: " + e);
                                }
                            };
                            // Load blob as Data URL
                            fileReader.readAsDataURL(blob);
                        }
                    }, false);
                    // Send XHR
                    xhr.send();
                }

                /**
                 * @function changed
                 * @memberOf hs.panoramio.service
                 * @description Callback function for map events used to throtle down the requests being made to API
                 * @param {object} path - URL of image
                 */
                var changed = function(e) {
                    if (timer != null) clearTimeout(timer);
                    timer = setTimeout(function() {
                        me.update(e)
                    }, 500);
                }

                /**
                 * @function init
                 * @memberOf hs.panoramio.service
                 * @description Syntactic sugar for initialization
                 */
                this.init = function() {
                    me.saved_items = me.getSavedItems();
                    me.lyr = lyr = new ol.layer.Vector({
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
                            if (max_pop == 100000) {
                                style.push(new ol.style.Style({
                                    image: new ol.style.RegularShape({
                                        fill: new ol.style.Fill({
                                            color: [242, 242, 0, 0.7]
                                        }),
                                        stroke: new ol.style.Stroke({
                                            color: [0x77, 0x77, 0x00, 0.9]
                                        }),
                                        radius1: 17,
                                        radius2: 7,
                                        points: 5
                                    })
                                }));
                            }
                            return style;
                        }
                    });

                    default_layers.push(lyr);
                    var features = [];
                    angular.forEach(me.saved_items, function(item, address) {
                        var feature = loadLocalFeature(item, address);
                        if (feature) features.push(feature);
                    });
                    src.addFeatures(features);
                    me.source = src;
                    OlMap.map.getView().on('change:center', changed);
                    OlMap.map.getView().on('change:resolution', changed);
                    changed();
                }

                this.init();
            }
        ])

        .run(['hs.panoramio.service', function(service) { // instance-injector
            //Gets executed after service is loaded
            if (console) console.log('Panoramio loaded');
        }]);
    })
