import metadataDialogDirective from './metadata-dialog.directive';
import advancedMickaDialogDirective from './advanced-micka-dialog.directive';
import suggestionsDialogDirective from './suggestions-dialog.directive';
import objectDirective from './object.directive';
import datasourceSelectorService from './datasource-selector.service';
import datasourceSelectorComponent from './datasource-selector.component';

/**
 * @namespace hs.datasource_selector
 * @memberOf hs
 */
angular.module('hs.datasource_selector', ['hs.map'])
    /**
     * @ngdoc directive
     * @name hs.datasource_selector.metadataDialogDirective
     * @memberOf hs.datasource_selector
     * @description Directive for displaying metadata about data source
     */
    .directive('hs.datasourceSelector.metadataDialogDirective', metadataDialogDirective)

    /**
     * @ngdoc directive
     * @name hs.datasource_selector.advancedMickaDialogDirective
     * @memberOf hs.datasource_selector
     * @description Directive for displaying extended search parameters for Micka catalogue service
     */
    .directive('hs.datasourceSelector.advancedMickaDialogDirective', advancedMickaDialogDirective)

    /**
     * @ngdoc directive
     * @name hs.datasource_selector.suggestionsDialogDirective
     * @memberOf hs.datasource_selector
     * @description Directive for displaying suggestions for search parameters for Micka catalogue service
     */
    .directive('hs.datasourceSelector.suggestionsDialogDirective', suggestionsDialogDirective)

    /**
     * @ngdoc directive
     * @name hs.datasource_selector.objectDirective
     * @memberOf hs.datasource_selector
     * @description Directive for displaying metadata about data source
     */
    .directive('hs.datasourceSelector.objectDirective', objectDirective)

    .service('hs.datasource_selector.service', datasourceSelectorService)

    /**
     * @ngdoc component
     * @memberof hs.datasource_selector
     * @name hs.datasource_selector
     * @description Display Datasource selector panel in app. Panel contains datasource types switcher and loaded list of datas. 
     */
    .component('hs.datasourceSelector', datasourceSelectorComponent);

