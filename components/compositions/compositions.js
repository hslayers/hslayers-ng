if(require.config) require.config({
    paths: {
        'hs.compositions.service_parser': hsl_path + 'components/compositions/hs.compositions.service_parser' + hslMin,
        'hs.compositions.service': hsl_path + 'components/compositions/hs.compositions.service' + hslMin,
        'hs.compositions.controller': hsl_path + 'components/compositions/hs.compositions.controller' + hslMin
    }
})

/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Test composition module
 */
define(['angular', 'ol', 'hs.source.SparqlJson', 'angular-socialshare', 'hs.compositions.service', 'hs.compositions.service_parser', 'hs.compositions.controller', 'map', 'ows_nonwms', 'config_parsers'],

    function (angular, ol, SparqlJson, social, hsCompositionsService, hsCompositionsServiceParser, hsCompositionsController) {
        var module = angular.module('hs.compositions', ['720kb.socialshare', 'hs.map', 'hs.core', 'hs.ows.nonwms', 'hs.compositions.config_parsers'])
            .directive('hs.compositions.directive', ['config', function (config) {
                return {
                    templateUrl: `${hsl_path}components/compositions/partials/compositions${config.design || ''}.html?bust=${gitsha}`,
                    link: function (scope, element) {
                        if(angular.isUndefined(config.design) || config.design == ''){
                            $('.mid-pane').css('margin-top', '0px');
                            $(".keywords-panel").hide();
                        }
                    }
                };
            }])
            /**
             * @module hs.compositions
             * @name hs.compositions.overwriteDialogDirective
             * @ngdoc directive
             * @description Display dialog window for situation, when new composition is to be loaded while there are unsaved changes in old composition 
             */
            .directive('hs.compositions.overwriteDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_overwriteconfirm.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-overwrite-dialog').modal('show');
                    }
                };
            })
            /**
             * @module hs.compositions
             * @name hs.compositions.deleteDialogDirective
             * @ngdoc directive
             * @description Display dialog window for confiriming deletion of selected composition
             */
            .directive('hs.compositions.deleteDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_delete.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-delete-dialog').modal('show');
                    }
                };
            })
            /**
             * @module hs.compositions
             * @name hs.compositions.shareDialogDirective
             * @ngdoc directive
             * @description Display dialog of sharing composition (URL / Social networks)
             */
            .directive('hs.compositions.shareDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_share.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-share-dialog').modal('show');
                    }
                };
            })
            /**
             * @module hs.compositions
             * @name hs.compositions.infoDialogDirective
             * @ngdoc directive
             * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
             */
            .directive('hs.compositions.infoDialogDirective', function () {
                return {
                    templateUrl: hsl_path + 'components/compositions/partials/dialog_info.html?bust=' + gitsha,
                    link: function (scope, element, attrs) {
                        $('#composition-info-dialog').modal('show');
                    }
                };
            })

        hsCompositionsServiceParser.init();
        hsCompositionsService.init();
        hsCompositionsController.init();

    })
