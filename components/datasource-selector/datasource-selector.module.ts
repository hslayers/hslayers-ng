import '../../common/endpoints/endpoints.module';
import '../../common/widgets/widgets.module';
import '../layout';
import * as angular from 'angular';
import advancedMickaDialogDirective from './micka/advanced-micka-dialog.directive';
import datasourceSelectorComponent from './datasource-selector.component';
import datasourceSelectorMapService from './datasource-selector-map.service';
import datasourceSelectorService from './datasource-selector.service';
import forDatasourceBrowserFilter from './for-datasource-browser.filter';
import laymanService from './layman/layman.service';
import metadataDialogDirective from './metadata-dialog.directive';
import mickaFilterService from './micka/micka-filters.service';
import mickaFiltersDirective from './micka/micka-filters.directive';
import mickaService from './micka/micka.service';
import mickaSuggestionsDialogDirective from './micka/micka-suggestions-dialog.directive';
import selectTypeToAddLayerDialogComponent from './select-type-to-add-layer-dialog.component';
/**
 * @namespace hs.datasource_selector
 * @memberOf hs
 */
angular
  .module('hs.datasource_selector', [
    'hs.map',
    'hs.widgets',
    'hs.layout',
    'hs.permalink',
  ])
  /**
   * @ngdoc directive
   * @name hs.datasourceSelector.metadataDialogDirective
   * @memberOf hs.datasource_selector
   * @description Directive for displaying metadata about data source
   */
  .directive(
    'hs.datasourceSelector.metadataDialogDirective',
    metadataDialogDirective
  )

  /**
   * @ngdoc directive
   * @name hs.advMickaDialog
   * @memberOf hs.datasource_selector
   * @description Directive for displaying extended search parameters for
   * Micka catalogue service
   */
  .directive('hs.advMickaDialog', advancedMickaDialogDirective)

  /**
   * @ngdoc directive
   * @name hs.mickaSuggestionsDialog
   * @memberOf hs.datasource_selector
   * @description Directive for displaying suggestions for search parameters for Micka catalogue service
   */
  .directive('hs.mickaSuggestionsDialog', mickaSuggestionsDialogDirective)

  /**
   * @ngdoc directive
   * @name hs.mickaFiltersDirective
   * @memberOf hs.datasource_selector
   * @description Directive for providing basic html elements for Micka
   * metadata filtering
   */
  .directive('hs.mickaFiltersDirective', mickaFiltersDirective)

  /**
   * @ngdoc service
   * @name HsMickaFiltersService
   * @memberOf hs.datasource_selector
   * @description Service for calling catalogue loaders and managing layers -
   * initiating adding to map, downloading, storing layer extents
   */
  .factory('HsDatasourceBrowserService', datasourceSelectorService)

  /**
   * @module hs.datasource_selector
   * @name HsDataSourceSelectorMapService
   * @ngdoc controller
   * @description Service of composition module which deal ith OpenLayers map objects
   */
  .factory('HsDataSourceSelectorMapService', datasourceSelectorMapService)

  /**
   * @ngdoc service
   * @name HsMickaFiltersService
   * @memberOf hs.datasource_selector
   * @description Service for managing micka query filter parameters and
   * their possible values i.e. suggestions
   */
  .factory('HsMickaFiltersService', mickaFilterService)

  /**
   * @ngdoc service
   * @name HsMickaBrowserService
   * @memberOf hs.datasource_selector
   * @description Service for querying layer from Micka metadata catalogue
   */
  .factory('HsMickaBrowserService', mickaService)

  /**
   * @ngdoc service
   * @name HsLaymanBrowserService
   * @memberOf hs.datasource_selector
   * @description Service for querying layer from Layman
   */
  .factory('HsLaymanBrowserService', laymanService)

  /**
   * @ngdoc component
   * @memberof hs.datasource_selector
   * @name hs.datasourceSelector
   * @description Display Datasource selector panel in app. Panel contains datasource types switcher and loaded list of datas.
   */
  .component('hs.datasourceSelector', datasourceSelectorComponent)

  .component(
    'hsSelectTypeToAddLayerDialog',
    selectTypeToAddLayerDialogComponent
  )

  .filter('forDatasourceBrowser', forDatasourceBrowserFilter);
