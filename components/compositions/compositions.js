import hsCompositionsService from 'hs.compositions.service';
import hsCompositionsServiceParser from 'hs.compositions.service_parser';
import hsCompositionsController from 'hs.compositions.controller';
import SparqlJson from 'hs.source.SparqlJson'
import 'utils';
import 'ows_nonwms';
import social from 'angular-socialshare'
import 'config_parsers';

/**
 * @ngdoc module
 * @module hs.compositions
 * @name hs.compositions
 * @description Test composition module
 */
var module = angular.module('hs.compositions', ['720kb.socialshare', 'hs.map', 'hs.core', 'hs.ows.nonwms', 'hs.compositions.config_parsers'])
    .directive('hs.compositions.directive', ['config', function (config) {
        return {
            template: require('components/compositions/partials/compositions.html'),
            link: function (scope, element) {
                if (angular.isUndefined(config.design) || config.design == '') {
                    var el = document.getElementsByClassName('mid-pane');
                    if (el.length > 0) {
                        el[0].style.marginTop = '0px';
                    }
                    var el = document.getElementsByClassName('keywords-panel');
                    if (el.length > 0) {
                        el[0].style.display = 'none';
                    }
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
    .directive('hs.compositions.overwriteDialogDirective', ['config', function (config) {
        return {
            template: require('components/compositions/partials/dialog_overwriteconfirm.html'),
            link: function (scope, element, attrs) {
                scope.overwriteModalVisible = true;
            }
        };
    }])
    /**
     * @module hs.compositions
     * @name hs.compositions.deleteDialogDirective
     * @ngdoc directive
     * @description Display dialog window for confiriming deletion of selected composition
     */
    .directive('hs.compositions.deleteDialogDirective', ['config', function (config) {
        return {
            template: require('components/compositions/partials/dialog_delete.html'),
            link: function (scope, element, attrs) {
                scope.deleteModalVisible = true;
            }
        };
    }])
    /**
     * @module hs.compositions
     * @name hs.compositions.shareDialogDirective
     * @ngdoc directive
     * @description Display dialog of sharing composition (URL / Social networks)
     */
    .directive('hs.compositions.shareDialogDirective', ['config', function (config) {
        return {
            template: require('components/compositions/partials/dialog_share.html'),
            link: function (scope, element, attrs) {
                scope.shareModalVisible = true;
            }
        };
    }])
    /**
     * @module hs.compositions
     * @name hs.compositions.infoDialogDirective
     * @ngdoc directive
     * @description Display dialog of composition info (name, abstract, thumbnail, extent, layers)
     */
    .directive('hs.compositions.infoDialogDirective', ['config', function (config) {
        return {
            template: require('components/compositions/partials/dialog_info.html'),
            link: function (scope, element, attrs) {
                scope.infoModalVisible = true;
            }
        };
    }])

hsCompositionsServiceParser.init();
hsCompositionsService.init();
hsCompositionsController.init();

