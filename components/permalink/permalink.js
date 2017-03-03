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
             * @description Display Embed map and share panel in the aplication. Panel contains Iframe code or Url links for current map or possibility to share map on social networks (Facebook, Twitter, Google+) with title and abstract.
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
             * @description Service responsible for creating permalink URLs. Mantain parameters information about map
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
                    
                    /**
                    * @function update
                    * @memberof hs.permalink.service_url
                    * @params {Object} e Event changing map state
                    * Get actual map state information (visible layers, added layers*, active panel, map center and zoom level), create full Url link and push it in Url bar. (*Added layers are ommited from permalink url).
                    */
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
                    
                    /**
                    * @function getPermalinkUrl
                    * @memberof hs.permalink.service_url
                    * @returns {String} Permalink url
                    * Create permalink Url to map
                    */
                    me.getPermalinkUrl = function() {
                        var stringLayers = (JSON.stringify(me.permalinkLayers));
                        stringLayers = stringLayers.substring(1, stringLayers.length - 1);
                        if (Core.isMobile() && config.permalinkLocation) {
                            return (config.permalinkLocation.origin + me.current_url.replace(window.location.pathname, config.permalinkLocation.pathname) + "&permalink=" + encodeURIComponent(stringLayers)).replace(window.location.pathname, config.permalinkLocation.pathname);
                        } else {
                            return window.location.origin + me.current_url + "&permalink=" + encodeURIComponent(stringLayers);
                        }
                    }

                    /**
                    * @function getPureMapUrl
                    * @memberof hs.permalink.service_url
                    * @returns {String} Embeded url
                    * Create Url for PureMap version of map
                    */
                    me.getPureMapUrl = function() {
                        var params = {};
                        params.puremap = "true";
                        return me.getPermalinkUrl() + "&" + utils.paramsToURLWoEncode(params);
                    }

                    /**
                    * @function parse
                    * @memberof hs.permalink.service_url
                    * @params {String} str Parameter string to parse
                    * @returns {Object} Parsed parameter object
                    * Parse parameter string from Url into key-value(s) pairs
                    */
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

                    /**
                    * @function parsePermalinkLayers
                    * @memberof hs.permalink.service_url
                    * Load layers received through permalink to map
                    */
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
                    
                    /**
                    * @function stringify
                    * @memberof hs.permalink.service_url
                    * @params {Object} obj Parameter object to stringify
                    * @returns {String} Encoded parameter string or "" if no parameter object is given
                    * Create encoded parameter string from parameter object
                    */
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
                    
                    /**
                    * @function push
                    * @memberof hs.permalink.service_url
                    * @params {Object key} key Key name for pushed parameter
                    * @params {Object value} new_value Value for pushed parameter
                    * Push new key-value pair into paramater object and update Url string with new params
                    */
                    me.push = function(key, new_value) {
                        me.params[key] = new_value;
                        var new_params_string = me.stringify(me.params);
                        me.param_string = new_params_string;
                        me.pathname = window.location.pathname;
                        me.current_url = me.pathname + '?' + new_params_string;
                    };

                    /**
                    * @function getParamValue
                    * @memberof hs.permalink.service_url
                    * @params {String} param Param to get current value
                    * @returns {String} Current value for requested param or null if param doesn´t exist
                    * Find current param value from Url
                    */
                    me.getParamValue = function(param) {
                        var tmp = me.parse(location.search);
                        if (tmp[param]) return tmp[param];
                        else return null;
                    };
                    
                    /**
                    * @function init
                    * @memberof hs.permalink.service_url
                    * Function for service initialization when map object is ready
                    */
                    function init(){
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
                    }
                    
                    $rootScope.$on('map.loaded', function(){
                       init();
                    });
                    return me;
                }
            ])
            /**
             * @ngdoc controller
             * @memberof hs.permalink
             * @name hs.permalink.controller
             */
            .controller('hs.permalink.controller', ['$rootScope', '$scope', '$http', 'Core', 'config', 'hs.permalink.service_url', 'Socialshare', 'hs.utils.service', 'hs.status_creator.service', '$q',
                function($rootScope, $scope, $http, Core, config, service, socialshare, utils, status_creator, $q) {

                    $scope.embedCode = "";
                    $scope.shareUrlValid = false;
                    service.shareId = null;
                    $scope.new_share = false;
                    $scope.shareLink = "permalink";
                    
                    /**
                     * @function updateEmbedCode
                     * @memberof hs.permalink.controller
                     * @returns {String} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
                     * Create Iframe tag for embeded map
                     */
                    $scope.updateEmbedCode = function() {
                            $scope.embedCode = '<iframe src="' + $scope.selectShareUrl() + '" width="1000" height="700"></iframe>';
                        }
                    
                    /**
                     * @function selectShareUrl
                     * @memberof hs.permalink.controller
                     * @returns {String} Right share Url
                     * Select right share Url based on shareLink property (either Permalink Url or PureMap url)
                     */
                    $scope.selectShareUrl = function() {
                        var shareUrl = "";
                        if ($scope.shareLink == "permalink") {
                            shareUrl = $scope.permalinkUrl; 
                        }
                        else {
                            shareUrl = $scope.pureMapUrl;
                        }
                        return shareUrl; 
                    }
                    
                    /**
                    * @function invalidateShareUrl
                    * @memberof hs.permalink.controller
                    * Set share Url state invalid
                    */
                    $scope.invalidateShareUrl = function() {
                            $scope.shareUrlValid = false;
                        }
                    
                    /**
                     * @function shareOnSocial
                     * @memberof hs.permalink.controller
                     * @param {String} provider Social network provider for sharing
                     * Create share post on selected social network
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
                                    url: encodeURIComponent($scope.selectShareUrl()),
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
                                                'socialshareText': $scope.title,
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
                                    'socialshareText': $scope.title,
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

                            $q.all([
                                $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                    longUrl: service.getPureMapUrl()
                                }).success(function(data, status, headers, config) {
                                    $scope.pureMapUrl = data.id;
                                }).error(function(data, status, headers, config) {
                                    console.log('Error creating short Url');
                                    $scope.pureMapUrl = service.getPureMapUrl();
                                }),

                                $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                    longUrl: service.getPermalinkUrl()
                                }).success(function(data, status, headers, config) {
                                    $scope.permalinkUrl = data.id;
                                }).error(function(data, status, headers, config) {
                                    console.log('Error creating short Url');
                                    $scope.permalinkUrl = service.getPermalinkUrl();
                                }),
                            ]).then(function() {
                                $scope.updateEmbedCode();
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
