define(['angular', 'ol', 'app', 'map', 'core'],

    function(angular, ol, app, map) {
        angular.module('hs.api', ['hs', 'hs.map', 'hs.core'])
            .service("Api", ['$rootScope', 'OlMap', '$controller', 'Core',
                function($rootScope, OlMap, $controller, Core) {
                    var me = {};
                    me.gui = {};
                    $rootScope.$on("scope_loaded", function(event, args) {
                        me.gui[args] = {};
                        for (var key in event.targetScope) {
                            //Dont show angularjs functions in the api
                            if (typeof event.targetScope.__proto__[key] === 'undefined') {
                                me.gui[args][key] = event.targetScope[key];
                            }
                        }
                    });
                    me.listScopes = function() {
                        var scopes = Core.getAllScopes();
                        var tmp = {};
                        for (var i = 0; i < scopes.length; i++) {
                            if (scopes[i].scope_name) {
                                tmp[scopes[i].scope_name] = scopes[i];
                            }
                        }
                        return tmp;
                    }
                    me.getMap = function() {
                        return OlMap.map;
                    }

                    window.hslayers_api = me;

                }
            ])

        .run(function(Api) {});
    })
