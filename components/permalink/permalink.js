/**
 * @namespace hs.permalink
 * @memberOf hs
 */
define(['angular', 'angularjs-socialshare', 'map', 'core', 'status_creator', 'compositions'],

    function(angular, social) {
        angular.module('hs.permalink', ['720kb.socialshare', 'hs.core', 'hs.map', 'hs.status_creator', 'hs.compositions'])
            /**
             * @ngdoc directive
             * @name hs.permalink.directive
             * @membeof hs.permalink
             */
            .directive('hs.permalink.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/permalink/partials/directive.html?bust=' + gitsha
                };
            })
            /**
             * @ngdoc service
             * @name hs.permalink.service_url
             * @membeof hs.permalink
             */
            .service("hs.permalink.service_url", ['$rootScope', '$location', '$window', 'hs.map.service', 'Core', 'hs.utils.service', 'hs.status_creator.service', 'hs.compositions.service_parser', 'config',
                function($rootScope, $location, $window, OlMap, Core, utils, status, compositions, config) {

                    var url_generation = true;
                    //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
                    var me = {};
                    me.current_url = "";
                    me.permalinkLayers = "";
                    me.added_layers = [];
                    me.params = [];
                    me.update = function(e) {
                        var view = OlMap.map.getView();
                        me.id = status.generateUuid();
                        var visible_layers = [];
                        var added_layers = [];
                        OlMap.map.getLayers().forEach(function(lyr) {
                            if (angular.isDefined(lyr.get('show_in_manager')) && lyr.get('show_in_manager') != null && lyr.get('show_in_manager') == false) return;
                            if (lyr.getVisible()) {
                                visible_layers.push(lyr.get("title"));
                            }
                            if (lyr.manuallyAdded != false) {
                                added_layers.push(lyr)
                            }
                        });
                        me.added_layers = status.layers2json(added_layers);

                        if (Core.mainpanel) {
                            if (Core.mainpanel == 'permalink') {
                                me.push('hs_panel', 'layermanager');
                            } else {
                                me.push('hs_panel', Core.mainpanel);
                            }
                        }
                        me.push('hs_x', view.getCenter()[0]);
                        me.push('hs_y', view.getCenter()[1]);
                        me.push('hs_z', view.getZoom());
                        me.push('visible_layers', visible_layers.join(";"));
                        window.history.pushState({
                            path: me.current_url
                        }, "any", window.location.origin + me.current_url);
                    };

                    me.getPermalinkUrl = function() {
                        var stringLayers = (JSON.stringify(me.permalinkLayers));
                        stringLayers = stringLayers.substring(1, stringLayers.length - 1);
                        if (Core.isMobile() && config.permalinkLocation) {
                            return (config.permalinkLocation.origin + me.current_url.replace(window.location.pathname, config.permalinkLocation.pathname) + "&permalink=" + encodeURIComponent(stringLayers)).replace(window.location.pathname, config.permalinkLocation.pathname);
                        } else {
                            return window.location.origin + me.current_url + "&permalink=" + encodeURIComponent(stringLayers);
                        }
                    }

                    me.getEmbededUrl = function() {
                        var stringLayers = (JSON.stringify(me.permalinkLayers));
                        stringLayers = stringLayers.substring(1, stringLayers.length - 1);
                        if (window.hsl_path.includes("../")) {
                            var embedHsl_Path = me.pathname + window.hsl_path;
                            var embedUrl = window.location.origin + me.pathname + window.hsl_path + "components/permalink/app/" + "?" + me.param_string;
                        } else if (Core.isMobile() && config.permalinkLocation) {
                            me.pathname = config.permalinkLocation.pathname;
                            var embedHsl_Path = config.permalinkLocation.hsl_path;
                            var embedUrl = config.permalinkLocation.origin + config.permalinkLocation.hsl_path + "components/permalink/app/" + "?" + me.param_string;
                        } else {
                            var embedHsl_Path = window.hsl_path;
                            var embedUrl = window.location.origin + window.hsl_path + "components/permalink/app/" + "?" + me.param_string;
                        }

                        var params = {
                            permalink: encodeURIComponent(stringLayers)
                        };
                        if (angular.isDefined(window.hsl_config))
                            params.config = window.hsl_config;
                        if (angular.isDefined(embedHsl_Path))
                            params.hsl_path = embedHsl_Path;
                        if (angular.isDefined(me.pathname + window.hsl_app) && angular.isDefined(window.hsl_app))
                            params.hsl_app = me.pathname + window.hsl_app;
                        return embedUrl + utils.paramsToURL(params);
                    }

                    me.parse = function(str) {
                        if (typeof str !== 'string') {
                            return {};
                        }

                        str = str.trim().replace(/^\?/, '');

                        if (!str) {
                            return {};
                        }

                        return str.trim().split('&').reduce(function(ret, param) {
                            var parts = param.replace(/\+/g, ' ').split('=');
                            var key = parts[0];
                            var val = parts[1];

                            key = decodeURIComponent(key);
                            // missing `=` should be `null`:
                            // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
                            val = val === undefined ? null : decodeURIComponent(val);

                            if (!ret.hasOwnProperty(key)) {
                                ret[key] = val;
                            } else if (Array.isArray(ret[key])) {
                                ret[key].push(val);
                            } else {
                                ret[key] = [ret[key], val];
                            }

                            return ret;
                        }, {});
                    };

                    me.parsePermalinkLayers = function() {
                        var layersUrl = utils.proxify(me.getParamValue('permalink'));
                        $.ajax({
                                url: layersUrl
                            })
                            .done(function(response) {
                                if (response.success == true) {
                                    var data = {};
                                    data.data = {};
                                    data.data.layers = response.data;
                                    compositions.removeCompositionLayers();
                                    response.layers = response.data;
                                    var layers = compositions.jsonToLayers(data);
                                    for (var i = 0; i < layers.length; i++) {
                                        OlMap.map.addLayer(layers[i]);
                                    }
                                } else {
                                    if (console) console.log('Error loading permalink layers');
                                }
                            })

                    }
                    me.stringify = function(obj) {
                        return obj ? Object.keys(obj).map(function(key) {
                            var val = obj[key];

                            if (Array.isArray(val)) {
                                return val.map(function(val2) {
                                    return encodeURIComponent(key) + '=' + encodeURIComponent(val2);
                                }).join('&');
                            }

                            return encodeURIComponent(key) + '=' + encodeURIComponent(val);
                        }).join('&') : '';
                    };
                    me.push = function(key, new_value) {
                        me.params[key] = new_value;
                        var new_params_string = me.stringify(me.params);
                        me.param_string = new_params_string;
                        me.pathname = window.location.pathname;
                        me.current_url = me.pathname + '?' + new_params_string;
                    };

                    me.getParamValue = function(param) {
                        var tmp = me.parse(location.search);
                        if (tmp[param]) return tmp[param];
                        else return null;
                    };
                    if (url_generation) {
                        var timer = null;
                        $rootScope.$on('map.extent_changed', function(event, data, b) {
                            me.update(event)
                            if (Core.mainpanel == 'permalink') {
                                $rootScope.$broadcast('browserurl.updated');
                            }
                        });
                        OlMap.map.getLayers().on("add", function(e) {
                            var layer = e.element;
                            if (layer.get('show_in_manager') != null && layer.get('show_in_manager') == false) return;
                            layer.on('change:visible', function(e) {
                                if (timer != null) clearTimeout(timer);
                                timer = setTimeout(function() {
                                    me.update(e)
                                }, 1000);
                            })
                        });
                    }
                    return me;
                }
            ])
            /**
             * @ngdoc controller
             * @memberof hs.permalink
             * @name hs.permalink.controller
             */
            .controller('hs.permalink.controller', ['$rootScope', '$scope', '$http', 'Core', 'config', 'hs.permalink.service_url', 'Socialshare', 'hs.utils.service', 'hs.status_creator.service',
                function($rootScope, $scope, $http, Core, config, service, socialshare, utils, status_creator) {

                    $scope.embed_code = "";
                    $scope.shareUrlValid = false;
                    service.shareId = null;
                    $scope.new_share = false;
                    /**
                     * @function getEmbedCode
                     * @memberof hs.permalink.controller
                     */
                    $scope.getEmbedCode = function() {
                            return '<iframe src="' + $scope.embed_url + '" width="1000" height="700"></iframe>';
                        }
                        /**
                         * @function invalidateShareUrl
                         * @memberof hs.permalink.controller
                         */
                    $scope.invalidateShareUrl = function() {
                            $scope.shareUrlValid = false;
                        }
                        /**
                         * @function shareOnSocial
                         * @memberof hs.permalink.controller
                         * @param {unknown} provider
                         */
                    $scope.shareOnSocial = function(provider) {
                        $scope.shareProvider = provider;
                        if (!$scope.shareUrlValid) {
                            if (service.shareId == null || $scope.new_share) service.shareId = utils.generateUuid();
                            $.ajax({
                                url: ((config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url),
                                cache: false,
                                method: 'POST',
                                async: false,
                                data: JSON.stringify({
                                    request: 'socialShare',
                                    id: service.shareId,
                                    url: encodeURIComponent($scope.embededUrl),
                                    title: $scope.title,
                                    description: $scope.abstract,
                                    image: $scope.thumbnail
                                }),
                                success: function(j) {
                                    $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                        longUrl: (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + config.status_manager_url + "?request=socialshare&id=" + service.shareId
                                    }).success(function(data, status, headers, config) {
                                        $scope.share_url = data.id;
                                        socialshare.share({
                                            'provider': $scope.shareProvider,
                                            'attrs': {
                                                'socialshareUrl': $scope.share_url,
                                                'socialsharePopupHeight': 600,
                                                'socialsharePopupWidth': 500
                                            }
                                        })
                                        $scope.shareUrlValid = true;
                                    }).error(function(data, status, headers, config) {
                                        console.log('Error creating short Url');
                                    });
                                }
                            })
                        } else {
                            socialshare.share({
                                'provider': provider,
                                'attrs': {
                                    'socialshareUrl': $scope.share_url,
                                    'socialsharePopupHeight': 600,
                                    'socialsharePopupWidth': 500
                                }
                            })
                        }


                    }

                    $scope.$on('core.mainpanel_changed', function(event) {
                        if (Core.mainpanel == 'permalink') {
                            service.update();
                            var status_url = (config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url)) + (config.status_manager_url || "/wwwlibs/statusmanager2/index.php");
                            if (service.added_layers.length > 0) {
                                $.ajax({
                                    url: status_url,
                                    cache: false,
                                    method: 'POST',
                                    dataType: "json",
                                    data: JSON.stringify({
                                        data: service.added_layers,
                                        permalink: true,
                                        id: service.id,
                                        project: config.project_name,
                                        request: "save"
                                    }),
                                    success: function(j) {
                                        service.permalinkLayers = status_url + "?request=load&id=" + service.id;
                                        $rootScope.$broadcast('browserurl.updated');

                                    },
                                    error: function() {
                                        console.log('Error saving permalink layers.');
                                        $scope.success = false;
                                    }
                                })
                            } else {
                                $rootScope.$broadcast('browserurl.updated');
                            }
                        }
                    });
                    $scope.$on('browserurl.updated', function() {
                        if (Core.mainpanel == "permalink") {

                            $scope.shareUrlValid = false;

                            $scope.embededUrl = service.getEmbededUrl();
                            $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                longUrl: $scope.embededUrl
                            }).success(function(data, status, headers, config) {
                                $scope.embed_url = data.id;
                                $scope.embed_code = $scope.getEmbedCode();
                            }).error(function(data, status, headers, config) {
                                console.log('Error creating short Url');
                                $scope.embed_url = $scope.embededUrl;
                                $scope.embed_code = $scope.getEmbedCode();
                            });

                            $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                longUrl: service.getPermalinkUrl()
                            }).success(function(data, status, headers, config) {
                                $scope.permalink_url = data.id;
                            }).error(function(data, status, headers, config) {
                                console.log('Error creating short Url');
                                $scope.permalink_url = service.getPermalinkUrl();
                            });
                        }
                        if (!$scope.$$phase) $scope.$digest();
                    })

                    $scope.$on('core.mainpanel_changed', function(event) {
                        if (Core.mainpanel == 'permalink') {
                            status_creator.generateThumbnail($('#hs-permalink-thumbnail'), $scope);
                        }
                    });


                    $scope.$on('map.extent_changed', function(event, data, b) {
                        status_creator.generateThumbnail($('#hs-permalink-thumbnail'), $scope);

                    });
                    
                    $scope.$on('compositions.composition_loaded', function(event, data) {
                        if(angular.isDefined(data.data)){
                            data = data.data;
                            $scope.title = data.title;
                            if(config.social_hashtag) $scope.title += ' ' + config.social_hashtag;
                            $scope.abstract = data.abstract;
                        }
                    })

                    $scope.$emit('scope_loaded', "Permalink");
                }
            ]);
    })
