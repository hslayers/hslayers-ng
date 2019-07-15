import 'angular-cookies';
import saveMapComponent from './save-map.component';
import saveMapService from './save-map.service';
import saveMapManagerService from './save-map-manager.service';

/**
 * @namespace hs.save-map
 * @memberOf hs
 */

var module = angular.module('hs.save-map', ['hs.map', 'hs.core', 'ngCookies'])
    /**
     * @ngdoc directive
     * @name hs.save-map.directive
     * @memberof hs.save-map
     * @description Display Save map (composition) dialog
     */
    .directive('hs.save-map.directive', ['config', function (config) {
        return {
            template: require('components/save-map/partials/dialog.html')
        };
    }])

    /**
     * @ngdoc directive
     * @name hs.saveMap.directiveForm
     * @memberof hs.save-map
     * @description Display advanced form to collect information (metadata) about saved composition
     */
    .directive('hs.saveMap.directiveForm', ['config', function (config) {
        return {
            template: require('components/save-map/partials/form.html')
        };
    }])
    /**
     * @ngdoc directive
     * @name hs.saveMap.directiveSimpleform
     * @memberof hs.save-map
     * @description Display simple form to collect information (metadata) about saved composition
     */
    .directive('hs.saveMap.directiveSimpleform', ['config', function (config) {
        return {
            template: require('components/save-map/partials/simpleform.html')
        };
    }])
    /**
     * @ngdoc directive
     * @name hs.saveMap.directivePanel
     * @memberof hs.save-map
     * @description Display Save map panel in app (base directive, extended by forms)
     */
    .directive('hs.saveMap.directivePanel', ['config', function (config) {
        return {
            template: require(`components/save-map/partials/panel.html`),
        };
    }])
    /**
     * @ngdoc directive
     * @name hs.saveMap.resultDialogDirective
     * @memberof hs.save-map
     * @description Display dialog about result of saving to status manager operation
     */
    .directive('hs.saveMap.resultDialogDirective', ['config', function (config) {
        return {
            template: require('components/save-map/partials/dialog_result.html'),
            link: function (scope, element, attrs) {
                scope.resultModalVisible = true;
            }
        };
    }])
    /**
     * @ngdoc directive
     * @name hs.saveMap.saveDialogDirective
     * @memberof hs.save-map
     * @description Display saving dialog (confirmation of saving, overwriting, selection of name)
     */
    .directive('hs.saveMap.saveDialogDirective', ['config', function (config) {
        return {
            template: require('components/save-map/partials/dialog_save.html'),
            link: function (scope, element, attrs) {
                scope.saveCompositionModalVisible = true;
            }
        };
    }])
    /**
     * @ngdoc directive
     * @name hs.saveMap.focusName
     * @memberof hs.save-map
     * @description UNUSED?
     */
    .directive('hs.saveMap.focusName', function ($timeout) {
        return {
            link: function (scope, element, attrs) {
                scope.$watch(attrs.focusName, function (value) {
                    if (value === true) {
                        console.log('value=', value);
                        element[0].focus();
                        scope[attrs.focusName] = false;
                        //});
                    }
                });
            }
        };
    })
    /**
     * @ngdoc service
     * @name hs.save-map.service
     * @memberof hs.save-map
     * @description Service for converting composition and composition data into JSON object which can be saved on server
     */
    .service('hs.save-map.service', saveMapService)

    .service('hs.save-map.managerService', saveMapManagerService)
    
    /**
     * @ngdoc component
     * @name hs.saveMap
     * @memberof hs.save-map
     */
    .component('hs.saveMap', saveMapComponent);
