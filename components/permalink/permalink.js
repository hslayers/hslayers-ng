/**
 * @namespace hs.permalink
 * @memberOf hs
 */
define(['angular', 'angular-socialshare', 'map', 'core', 'status_creator', 'compositions'],

    function(angular, social) {
        angular.module('hs.permalink', ['720kb.socialshare', 'hs.core', 'hs.map', 'hs.status_creator', 'hs.compositions'])
        
            .config(['$locationProvider', function($locationProvider) {
                $locationProvider.html5Mode({
                    enabled: true,
                    requireBase: false
                });
            }])
            
            /**
             * @ngdoc directive
             * @name hs.permalink.directive
             * @membeof hs.permalink
             * @description Display Embed map and share panel in the aplication. Panel contains Iframe code or Url links for current map or possibility to share map on social networks (Facebook, Twitter, Google+) with title and abstract.
             */
            .directive('hs.permalink.directive', ['config', function(config) {
                return {
                    templateUrl: `${hsl_path}components/permalink/partials/directive${config.design || ''}.html?bust=${gitsha}`,
                };
            }])
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
                    me.shareId = null;
                    me.current_url = "";
                    me.permalinkLayers = "";
                    me.added_layers = [];
                    me.params = {};
                    me.customParams = {};
                        
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
                        if(Core.language) me.push('lang', Core.language);
                        me.push('visible_layers', visible_layers.join(";"));
                        if (Core.puremapApp) me.push('puremap', "true");
                        for (var cP in me.customParams) {
                            me.push(cP,me.customParams[cP]);
                        }
                        $location.search(me.params);
                        if (!$rootScope.$$phase) $rootScope.$digest();
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
                                        OlMap.addLayer(layers[i]);
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
                    
                    var paramTimer = null;
                    me.updateCustomParams = function(params) {
                        for (param in params) {
                            me.customParams[param] = params[param];
                        }
                        if (paramTimer != null) clearTimeout(paramTimer);
                        paramTimer = setTimeout(function() {
                            me.update()
                        }, 1000);
                    }
                    
                    /**
                    * @function init
                    * @memberof hs.permalink.service_url
                    * Function for service initialization when map object is ready
                    */
                    function init(){
                        if (url_generation) {
                            var timer = null;
                            $rootScope.$on('map.extent_changed', function(event, data, b) {
                                me.update()
                                $rootScope.$broadcast('browserurl.updated');
                            });
                            OlMap.map.getLayers().on("add", function(e) {
                                var layer = e.element;
                                if (layer.get('show_in_manager') != null && layer.get('show_in_manager') == false) return;
                                layer.on('change:visible', function(e) {
                                    if (timer != null) clearTimeout(timer);
                                    timer = setTimeout(function() {
                                        me.update();
                                        $rootScope.$broadcast('browserurl.updated');
                                    }, 1000);
                                })
                            });
                            if (me.getParamValue('lang')) {
                                Core.setLanguage(me.getParamValue('lang'));
                            }
                        }
                    }
                    
                    if(angular.isDefined(OlMap.map))
                        init()
                    else
                        $rootScope.$on('map.loaded', function(){
                            init();
                        });
                    return me;
                }
            ])
            /**
             * @ngdoc service
             * @name hs.permalink.shareService
             * @membeof hs.permalink
             * @description Service responsible for sharing background. Mantain correct sharing links on the fly
             */
            .service('hs.permalink.shareService', ['$rootScope', '$http', 'Core', 'config', 'hs.permalink.service_url', 'Socialshare', 'hs.utils.service', 'hs.map.service', '$q',
                function($rootScope, $http, Core, config, serviceURL, socialshare, utils, OlMap, $q) {
                    me.data = {};
                    me.data.pureMapUrl = "";
                    me.data.permalinkUrl = "";
                    me.data.shareLink = "permalink";
                    me.data.embedCode = "";
                    me.data.shareUrlValid = false;
                    me.data.title = "";
                    me.data.abstract = "";
                    /**
                     * @memberof permalink.shareService
                     * @function getEmbedCode
                     * @public
                     * @description Get correct Embed code with correct share link type
                     */
                    me.getEmbedCode = function() {
                        me.data.embedCode = '<iframe src="' + me.getShareUrl() + '" width="1000" height="700"></iframe>';
                        if (!$rootScope.$$phase) $rootScope.$digest();
                        return me.data.embedCode;
                    }
                    /**
                     * @memberof permalink.shareService
                     * @function getShareUrl
                     * @public
                     * @return {String} Share URL
                     * @description Get correct share Url based on app choice
                     */
                    me.getShareUrl = function () {
                        if (me.data.shareLink == "permalink") return me.data.permalinkUrl;
                        else if (me.data.shareLink == "puremap") return me.data.pureMapUrl;
                    }
                    /**
                     * @memberof permalink.shareService
                     * @function setShareType
                     * @public
                     * @params {String} link Share type to set (permalink/puremap)
                     * @description Set share typ and refresh embed code
                     */
                    me.setShareType = function(link) {
                        me.data.shareLink = link;
                        me.getEmbedCode();
                    }
                    /**
                     * @memberof permalink.shareService
                     * @function invalidateShareUrl
                     * @public
                     * @description Make current share url invalid for social sharing
                     */
                    me.invalidateShareUrl = function() {
                        me.data.shareUrlValid = false;
                    }
                    /**
                     * @memberof permalink.shareService
                     * @function shareOnSocial
                     * @public
                     * @params {String} provider Social share provider (twitter/facebook/google)
                     * @params {Boolean} newShare If new share record on server should be created 
                     * @description Share map on social network
                     */
                    me.shareOnSocial = function(provider, newShare) {
                        if (!me.data.shareUrlValid) {
                            if (serviceURL.shareId == null || newShare) serviceURL.shareId = utils.generateUuid();
                            $.ajax({
                                url: (getHostname() + config.status_manager_url),
                                cache: false,
                                method: 'POST',
                                async: false,
                                data: JSON.stringify({
                                    request: 'socialShare',
                                    id: serviceURL.shareId,
                                    url: encodeURIComponent(me.getShareUrl()),
                                    title: me.data.title,
                                    description: me.data.abstract,
                                    image: me.data.thumbnail
                                }),
                                success: function(j) {
                                    $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                        longUrl: getHostname() + config.status_manager_url + "?request=socialshare&id=" + serviceURL.shareId
                                    }).success(function(data, status, headers, config) {
                                        var shareUrl = data.id;
                                        socialshare.share({
                                            'provider': provider,
                                            'attrs': {
                                                'socialshareText': me.data.title,
                                                'socialshareUrl': shareUrl,
                                                'socialsharePopupHeight': 600,
                                                'socialsharePopupWidth': 500
                                            }
                                        })
                                        me.data.shareUrlValid = true;
                                    }).error(function(data, status, headers, config) {
                                        console.log('Error creating short Url');
                                    });
                                }
                            })
                        } else {
                            socialshare.share({
                                'provider': provider,
                                'attrs': {
                                    'socialshareText': me.data.title,
                                    'socialshareUrl': me.getShareUrl(),
                                    'socialsharePopupHeight': 600,
                                    'socialsharePopupWidth': 500
                                }
                            })
                        }
                    }
                    /**
                     * @memberof permalink.shareService
                     * @function generateThumbnail
                     * @public
                     * @params {Object} $element
                     * @description Generate thumbnail of current map and save it to variable and selected element
                     */
                    me.generateThumbnail = function($element) {
                        if (Core.mainpanel == 'status_creator' || Core.mainpanel == 'permalink' || Core.mainpanel == 'shareMap') {
                            $element.attr("crossOrigin", "Anonymous");
                            OlMap.map.once('postcompose', function(event) {
                                var myCanvas = document.getElementById('my_canvas_id');
                                var canvas = event.context.canvas;
                                var canvas2 = document.createElement("canvas");
                                var width = 256,
                                    height = 256;
                                canvas2.style.width = width + "px";
                                canvas2.style.height = height + "px";
                                canvas2.width = width;
                                canvas2.height = height;
                                var ctx2 = canvas2.getContext("2d");
                                ctx2.drawImage(canvas, canvas.width / 2 - height / 2, canvas.height / 2 - width / 2, width, height, 0, 0, width, height);
                                try {
                                    $element.attr('src', canvas2.toDataURL('image/png'));
                                    this.data.thumbnail = canvas2.toDataURL('image/jpeg', 0.8);
                                }
                                catch(e) {
                                    $element.attr('src', hsl_path + 'components/status_creator/notAvailable.png');
                                }
                                $element.width(width).height(height);
                            }, me);
                            OlMap.map.renderSync();
                        }
                    }
                    /**
                     * @memberof permalink.shareService
                     * @function getHostname
                     * @private
                     */
                    function getHostname(){
                        if(angular.isDefined(config.hostname))
                            return config.hostname.user ? config.hostname.user.url : (config.hostname.status_manager ? config.hostname.status_manager.url : config.hostname.default.url);
                        else
                            return "";
                    }
                    
                    $rootScope.$on('core.mainpanel_changed', function(event) {
                        if (Core.mainpanel == 'permalink') {
                            serviceURL.update();
                            var status_url = getHostname() + (config.status_manager_url || "/wwwlibs/statusmanager2/index.php");
                            if (serviceURL.added_layers.length > 0) {
                                $.ajax({
                                    url: status_url,
                                    cache: false,
                                    method: 'POST',
                                    dataType: "json",
                                    data: JSON.stringify({
                                        data: serviceURL.added_layers,
                                        permalink: true,
                                        id: serviceURL.id,
                                        project: config.project_name,
                                        request: "save"
                                    }),
                                    success: function(j) {
                                        serviceURL.permalinkLayers = status_url + "?request=load&id=" + serviceURL.id;
                                        $rootScope.$broadcast('browserurl.updated');

                                    },
                                    error: function() {
                                        console.log('Error saving permalink layers.');
                                    }
                                })
                            } else {
                                $rootScope.$broadcast('browserurl.updated');
                            }
                        }
                    });
                    
                    $rootScope.$on('browserurl.updated', function() {
                        if (Core.mainpanel == "permalink" || Core.mainpanel == "shareMap") {

                            me.data.shareUrlValid = false;

                            $q.all([
                                $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                    longUrl: serviceURL.getPureMapUrl()
                                }).success(function(data, status, headers, config) {
                                    me.data.pureMapUrl = data.id;
                                }).error(function(data, status, headers, config) {
                                    console.log('Error creating short Url');
                                    me.data.pureMapUrl = serviceURL.getPureMapUrl();
                                }),

                                $http.post('https://www.googleapis.com/urlshortener/v1/url?key=AIzaSyDn5HGT6LDjLX-K4jbcKw8Y29TRgbslfBw', {
                                    longUrl: serviceURL.getPermalinkUrl()
                                }).success(function(data, status, headers, config) {
                                    me.data.permalinkUrl = data.id;
                                }).error(function(data, status, headers, config) {
                                    console.log('Error creating short Url');
                                    me.data.permalinkUrl = serviceURL.getPermalinkUrl();
                                }),
                            ]).then(function() {
                                me.getEmbedCode();
                            });
                            
                        }
                        if (!$rootScope.$$phase) $rootScope.$digest();
                    })
                    
                    $rootScope.$on('core.mainpanel_changed', function(event) {
                        if (Core.mainpanel == 'permalink') {
                            OlMap.map.once('postrender', function(){
                                me.generateThumbnail($('#hs-permalink-thumbnail'));
                            });
                        }
                    });


                    $rootScope.$on('map.extent_changed', function(event) {
                        OlMap.map.once('postrender', function(){
                            me.generateThumbnail($('#hs-permalink-thumbnail'));
                        });

                    });
                    
                    $rootScope.$on('compositions.composition_loaded', function(event, data) {
                        if(angular.isDefined(data.data)){
                            data = data.data;
                            me.data.title = data.title;
                            if(config.social_hashtag) me.data.title += ' ' + config.social_hashtag;
                            me.data.abstract = data.abstract;
                        }
                    })
                    
                    return me;
                }])
            /**
             * @ngdoc controller
             * @memberof hs.permalink
             * @name hs.permalink.controller
             */
            .controller('hs.permalink.controller', ['$scope', 'hs.permalink.service_url', 'hs.permalink.shareService',
                function($scope, service, ShareService) {

                    $scope.data = ShareService.data;   
                    $scope.new_share = false;
                    
                    /**
                     * @function updateEmbedCode
                     * @memberof hs.permalink.controller
                     * @returns {String} Iframe tag with src attribute on embed Url and default width and height (1000x700px)
                     * @description Create Iframe tag for embeded map
                     */
                    $scope.updateEmbedCode = function() {
                            return ShareService.getEmbedCode();
                        }
                    
                    /**
                     * @function getShareUrl
                     * @memberof hs.permalink.controller
                     * @returns {String} Right share Url
                     * @description Select right share Url based on shareLink property (either Permalink Url or PureMap url)
                     */
                    $scope.getShareUrl = function() {
                        return ShareService.getShareUrl(); 
                    }
                    
                    /**
                     * @function setShareType
                     * @memberof hs.permalink.controller
                     * @returns {String} type
                     * @description 
                     */
                    $scope.setShareType = function(type) {
                        ShareService.setShareType(type);
                    }
                    
                    /**
                    * @function invalidateShareUrl
                    * @memberof hs.permalink.controller
                    * @description Set share Url state invalid
                    */
                    $scope.invalidateShareUrl = function() {
                            ShareService.invalidateShareUrl();
                        }
                    
                    /**
                     * @function shareOnSocial
                     * @memberof hs.permalink.controller
                     * @param {String} provider Social network provider for sharing
                     * @description Create share post on selected social network
                     */
                    $scope.shareOnSocial = function(provider) {
                        ShareService.shareOnSocial(provider,$scope.new_share);
                    }

                    $scope.$emit('scope_loaded', "Permalink");
                }
            ]);
    })
