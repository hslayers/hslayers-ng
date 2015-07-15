/**
* @namespace hs.permalink
* @memberOf hs  
*/ 
define(['angular', 'map', 'core'],

    function(angular) {
        angular.module('hs.permalink', ['hs.core', 'hs.map'])
            /* .directive('permalinkdialog', function() {
                 return {
                     templateUrl: 'js/components/permalink/partials/permalinkdialog.html'
                 };
             })
             .directive('permalinkbutton', function() {
                 return {
                     templateUrl: 'js/components/permalink/partials/permalinkbutton.html'
                 };
             })*/
            .service("BrowserUrlService", ['$rootScope', 'OlMap', 'Core',
                function($rootScope, OlMap, Core) {
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
                        var params = me.parse(location.search);
                        params[key] = new_value;
                        var new_params_string = me.stringify(params);
                        me.current_url = window.location.pathname + '?' + new_params_string;
                        history.pushState({}, "", me.current_url);
                    };
                    me.getParamValue = function(param, loc) {
                        if (!loc) loc = location.search;
                        var tmp = me.parse(loc);
                        if (tmp[param]) return tmp[param];
                        else return null;
                    };
                    if (url_generation) {
                        var timer = null;
                        /* OlMap.map.on('change:view', function(e) {
                             OlMap.map.getView().on('change:center', me.update);
                             OlMap.map.getView().on('change:resolution', me.update);
                         });*/
                        OlMap.map.getView().on('change:center', function(e) {
                            if (timer != null) clearTimeout(timer);
                            timer = setTimeout(function() {
                                me.update(e)
                            }, 1000);
                        });
                        OlMap.map.getView().on('change:resolution', function(e) {
                            if (timer != null) clearTimeout(timer);
                            timer = setTimeout(function() {
                                me.update(e)
                            }, 1000);
                        });
                    }
                    return me;
                }
            ])
            .controller('Permalink', ['$scope', 'BrowserUrlService',
                function($scope, BrowserUrlService) {
                    $scope.getCurrentUrl = function() {
                        return window.location.origin + BrowserUrlService.current_url;
                    }
                    $scope.getEmbedCode = function() {
                        return '<iframe src="' + window.location.origin + BrowserUrlService.current_url + '" width="1000" height="700"></iframe>';
                    }
                    $scope.$emit('scope_loaded', "Permalink");
                }
            ]);
    })
