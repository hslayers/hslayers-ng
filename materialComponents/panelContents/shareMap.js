/**
 * @namespace hs.material.search
 * @memberOf hs
 */
define(['angular', 'ol','ngMaterial', 'ngclipboard'],

    function(angular, ol, ngMaterial, ngclipboard) {
        angular.module('hs.material.shareMap', ['ngMaterial'])
            
            .directive('hs.material.sharemap.directive', function() {
                return {
                    templateUrl: hsl_path + 'materialComponents/panelContents/shareMap.html?bust=' + gitsha,
                    link: function(scope, element) {

                    }
                };
            })
            .controller('hs.material.sharemap.controller', ['$scope', 'hs.permalink.service_url', 'hs.permalink.shareService',  
                function($scope, UrlService, ShareService) {
                    $scope.data = ShareService.data;

                    $scope.invalidateShareUrl = function() {
                        ShareService.invalidateShareUrl();
                    }

                    $scope.shareOnSocial = function(provider) {
                        ShareService.shareOnSocial(provider,false);
                    }

                    $scope.onClipSuccess = function(e) {
                        e.clearSelection();
                    };
                    
                    $scope.onClipError = function(e) {
                    }

                    $scope.$emit('scope_loaded', "MaterialSharemap");
                }
            ]);
    })
