define(['angular', 'core', 'angular-material'],
    function (angular, core, ngMaterial) {
        angular.module('hs.material.sidepanel', ['hs.core'])
            .directive('hs.material.sidepanel.panelright.directive', ['config', function (config) {
                return {
                    template: require('materialComponents/pageSystem/rightPanel.html'),
                    link: function (scope, element) {

                    }
                };
            }])

            .directive('hs.material.sidepanel.panelleft.directive', ['config', function (config) {
                return {
                    template: require('materialComponents/pageSystem/leftPanel.html'),
                    link: function (scope, element) {

                    }
                };
            }])

            .service('hs.material.sidepanel.service', ['$rootScope', 'config', '$mdSidenav', '$interval', '$compile', 'Core',
            function ($rootScope, config, $mdSidenav, $interval, $compile, Core) {
                var me = this;

                me.data = {
                    'sidenav-right': {
                        status: false,
                        content: {
                            title: "Default",
                            innerHtml: "<p>pokus</p>",
                            status: false
                        },
                        directives: {
                            "layerManager": {
                                id: "layerManager",
                                status: false,
                                directive: 'hs.material.layermanager.directive',
                                controller: 'hs.material.layermanager.controller'
                            },
                            "basemap": {
                                id: "basemap",
                                status: false,
                                directive: 'hs.material.basemap.directive',
                                controller: 'hs.material.basemap.controller'
                            },
                            "addLayerWebservice": {
                                id: "addLayerWebservice",
                                status: false,
                                directive: 'hs.material.addlayerwebservice.directive',
                                controller: 'hs.material.addlayerwebservice.controller'
                            },
                            "shareMap": {
                                id: "shareMap",
                                status: false,
                                directive: 'hs.material.sharemap.directive',
                                controller: 'hs.material.sharemap.controller'
                            },
                            "measure": {
                                id: "measure",
                                status: false,
                                directive: 'hs.material.measure.directive',
                                controller: 'hs.material.measure.controller'
                            },
                            "composition": {
                                id: "composition",
                                status: false,
                                directive: 'hs.compositions.directive',
                                controller: 'hs.compositions.controller'
                            },
                            "statusCreator": {
                                id: "statusCreator",
                                status: false,
                                directive: 'hs.material.statuscreator.directive',
                                controller: 'hs.material.statuscreator.controller'
                            },
                            "datasourceBrowser": {
                                id: "datasourceBrowser",
                                status: false,
                                directive: 'hs.material.datasourcebrowser.directive',
                                controller: 'hs.material.datasourcebrowser.controller'
                            }
                        },
                        activeDirective: undefined
                    },
                    'sidenav-left': {
                        status: false,
                        content: {
                            title: "Default",
                            innerHtml: "<p>pokus</p>",
                            status: false
                        },
                        directives: {
                            "query": {
                                id: "query",
                                status: false,
                                directive: 'hs.material.query.directive',
                                controller: 'hs.material.query.controller'
                            }
                        },
                        activeDirective: undefined
                    }
                }

                me.closeSidenav = function (id) {
                    me.data[id].status = false;
                    cleanActive(id);
                    mapSizeInterval();
                }
                me.openSidenav = function (id) {
                    me.data[id].status = true;
                    mapSizeInterval();
                }
                me.toogleSidenav = function (id) {
                    me.data[id].status = !me.data[id].status;
                    mapSizeInterval();
                }
                me.isSidenavOpened = function (id) {
                    return me.data[id].status;
                }
                me.isDirectiveOpened = function (id,directive) {
                    return me.data[id].directives[directive].status;
                }
                function mapSizeInterval() {
                    $interval(function () {
                        $rootScope.$broadcast('Core_sizeChanged');
                    }, 20, 40);
                }

                function cleanActive(id){
                    if (me.data[id].activeDirective) {
                        me.data[id].directives[me.data[id].activeDirective].status = false;
                        me.data[id].activeDirective = undefined;
                    }
                    Core.setMainPanel('none',false,true);
                }

                me.setActiveDirective = function(side,directive,setPanel,queryable){
                    cleanActive(side);
                    me.data[side].directives[directive].status = true;
                    me.data[side].activeDirective = directive;
                    me.openSidenav(side);
                    if (!angular.isUndefined(setPanel)){
                        Core.setMainPanel(directive,false,angular.isDefined(queryable) ? queryable : true);
                    }
                }

                $rootScope.$on('menuButtonClicked', function(e,id){
                    if (angular.isUndefined(id) || Object.keys(me.data['sidenav-right'].directives).indexOf(id) < 0) return;
                    me.setActiveDirective('sidenav-right',id,true,true);
                    if (!$rootScope.$$phase) $rootScope.$digest();
                })

                return me;
            }])

            .controller("hs.material.sidepanel.panelright.controller", ['$scope', 'config', '$mdSidenav', '$interval', '$compile', 'hs.material.sidepanel.service',
                function ($scope, config, $mdSidenav, $interval, $compile, Sidenav) {
                    $scope.sidenav = Sidenav;

                    function addPanel(directive) {
                        var ngShow = "sidenav.isDirectiveOpened('sidenav-right','" + directive.id + "')";
                        var tag = '<div ' + directive.directive + ' ng-controller="' + directive.controller + '" ng-show="' + ngShow + '"></div>';
                        var el = angular.element(tag);
                        angular.element("#sidenav-right").append(el);
                        $compile(el)($scope);
                    }
                    
                    angular.forEach($scope.sidenav.data['sidenav-right'].directives, function(directive){
                        addPanel(directive);
                    })
                }])

                .controller("hs.material.sidepanel.panelleft.controller", ['$scope', 'config', '$mdSidenav', '$interval', '$compile', 'hs.material.sidepanel.service',
                function ($scope, config, $mdSidenav, $interval, $compile, Sidenav) {
                    $scope.sidenav = Sidenav;

                    function addPanel(directive) {
                        var ngShow = "sidenav.isDirectiveOpened('sidenav-left','" + directive.id + "')";
                        var tag = '<div ' + directive.directive + ' ng-controller="' + directive.controller + '" ng-show="' + ngShow + '"></div>';
                        var el = angular.element(tag);
                        angular.element("#sidenav-left").append(el);
                        $compile(el)($scope);
                    }
                    
                    angular.forEach($scope.sidenav.data['sidenav-left'].directives, function(directive){
                        addPanel(directive);
                    });
                }])
    })