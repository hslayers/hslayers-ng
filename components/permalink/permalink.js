/**
 * @namespace hs.permalink
 * @memberOf hs
 */
define(['angular', 'bson', 'map', 'core'],

    function(angular, bson) {
        angular.module('hs.permalink', ['hs.core', 'hs.map'])
            .directive('hs.permalink.directive', function() {
                return {
                    templateUrl: hsl_path + 'components/permalink/partials/directive.html?bust=' + gitsha
                };
            })
            .service("hs.permalink.service_url", ['$rootScope', 'hs.map.service', 'Core', 
                function($rootScope, OlMap, Core) {
										
					var BSON = bson().BSON;
					debugger;
					//var serialized = BSON.serialize({"something": something}, false, true, true);
                    
                    
                    var url_generation = true;
                    //some of the code is taken from http://stackoverflow.com/questions/22258793/set-url-parameters-without-causing-page-refresh
                    var me = {};
                    me.current_url = "";
                    me.update = function(e) {
                        var view = OlMap.map.getView();
                        me.push('hs_x', view.getCenter()[0]);
                        me.push('hs_y', view.getCenter()[1]);
                        me.push('hs_z', view.getZoom());
                        me.push('hs_panel', Core.mainpanel);
                        var visible_layers = [];
                        OlMap.map.getLayers().forEach(function(lyr) {
                            if (lyr.get('show_in_manager') != null && lyr.get('show_in_manager') == false) return;
                            if (lyr.getVisible()) {
                                visible_layers.push(lyr.get("title"));
                            }
                        });
                        me.push('visible_layers', visible_layers.join(";"));
                        history.pushState({}, "", me.current_url);
                        $rootScope.$broadcast('browserurl.updated');
                    };
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
                        me.current_url = window.location.pathname + '?' + new_params_string;
                    };
                    me.params = me.parse(location.search);
                    me.getParamValue = function(param, loc) {
                        if (!loc) loc = location.search;
                        var tmp = me.parse(loc);
                        if (tmp[param]) return tmp[param];
                        else return null;
                    };
                    if (url_generation) {
                        var timer = null;
                        $rootScope.$on('map.extent_changed', function(event, data, b) {
                            me.update(event)
                        });
                        OlMap.map.getLayers().on("add", function(e) {
                            e.element.on('change:visible', function(e) {
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
            .controller('hs.permalink.controller', ['$scope', 'hs.permalink.service_url',
                function($scope, service) {
                    $scope.embed_code = "";
                    $scope.getCurrentUrl = function() {
                        return window.location.origin + service.current_url;
                    }
                    $scope.getEmbedCode = function() {
                        return '<iframe src="' + window.location.origin + service.current_url + '" width="1000" height="700"></iframe>';
                    }
                    $scope.$on('browserurl.updated', function() {
                        $scope.embed_code = $scope.getEmbedCode();
                        if (!$scope.$$phase) $scope.$digest();
                    })
                    $scope.$emit('scope_loaded', "Permalink");
                }
            ]);
    })
