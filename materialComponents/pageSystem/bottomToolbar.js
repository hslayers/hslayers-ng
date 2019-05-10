/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','angular-material'],

    function(angular, ol, ngMaterial) {
        angular.module('hs.material.bottomToolbar', ['ngMaterial'])
            
            .directive('hs.material.bottomtoolbar.directive', ['config', function (config) {
                return {
                    template: require('materialComponents/pageSystem/bottomToolbar.html'),
                    link: function(scope, element) {

                    }
                };
            })
            .controller('hs.material.bottomToolbar.controller', ['$scope', 'config', 'gettext', 
                function($scope, config, gettext) {
                    $scope.buttons = [
                        {
                            item: 'statusCreator',
                            tooltip: gettext('Save map'),
                            icon: 'save',
                            show:  (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.info)) ? config.bottomToolbar.info : true
                        },
                        {
                            item: 'measure',
                            tooltip: gettext('Measure on map'),
                            icon: 'timeline',
                            show: (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.measure)) ? config.bottomToolbar.measure : true
                        },
                        {
                            item: 'shareMap',
                            tooltip: gettext('Share map'),
                            icon: 'share',
                            show: (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.share)) ? config.bottomToolbar.share : true
                        },
                        {
                            item: 'print',
                            tooltip: gettext('Print map'),
                            icon: 'print',
                            show:  (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.print)) ? config.bottomToolbar.print : true
                        },
                        ,
                        {
                            item: 'help',
                            tooltip: gettext('App help'),
                            icon: 'help',
                            show: (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.help)) ? config.bottomToolbar.help : true
                        },
                        {
                            item: 'info',
                            tooltip: gettext('App info'),
                            icon: 'info',
                            show:  (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.info)) ? config.bottomToolbar.info : true
                        }
                    ];

                    $scope.buttonClicked = function(button) {
                        $scope.$emit('menuButtonClicked', button);
                    }

                    if (angular.isDefined(config.bottomToolbar) && angular.isDefined(config.bottomToolbar.customButton)) {
                        
                    }

                    /*
                        config.bottomToolbar.buttonStatus.xxx
                    */

                    $scope.$emit('scope_loaded', "bottomToolbar");
                }
            ]);
    })
