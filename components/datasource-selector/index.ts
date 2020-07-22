import '../../common/endpoints/endpoints.module';
import '../../common/widgets/widgets.module';
import '../layout';
import * as angular from 'angular';
import advancedMickaDialogDirective from './micka/advanced-micka-dialog.directive';
import metadataDialogDirective from './metadata-dialog.directive';
import mickaFiltersDirective from './micka/micka-filters.directive';
import mickaSuggestionsDialogDirective from './micka/micka-suggestions-dialog.directive';
import {HsDatasourcesComponent} from './datasource-selector.component';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesModule} from './datasource-selector.module';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsForDatasourceBrowserFilter} from './for-datasource-browser.filter';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsSelectTypeToAddLayerDialogComponent} from './select-type-to-add-layer-dialog.component';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedDatasourcesModule = downgrade(HsDatasourcesModule);

/**
 * @namespace hs.datasource_selector
 * @memberof hs
 */
angular
  .module(downgradedDatasourcesModule, [
    'hs.map',
    'hs.widgets',
    'hs.layout',
    'hs.permalink',
  ])
  /**
   * @ngdoc directive
   * @name hs.datasourceSelector.metadataDialogDirective
   * @memberof hs.datasource_selector
   * @description Directive for displaying metadata about data source
   */
  .directive(
    'hs.datasourceSelector.metadataDialogDirective',
    metadataDialogDirective
  )

  /**
   * @ngdoc directive
   * @name hs.advMickaDialog
   * @memberof hs.datasource_selector
   * @description Directive for displaying extended search parameters for
   * Micka catalogue service
   */
  .directive('hs.advMickaDialog', advancedMickaDialogDirective)

  /**
   * @ngdoc directive
   * @name hs.mickaSuggestionsDialog
   * @memberof hs.datasource_selector
   * @description Directive for displaying suggestions for search parameters for Micka catalogue service
   */
  .directive('hs.mickaSuggestionsDialog', mickaSuggestionsDialogDirective)

  /**
   * @ngdoc directive
   * @name hs.mickaFiltersDirective
   * @memberof hs.datasource_selector
   * @description Directive for providing basic html elements for Micka
   * metadata filtering
   */
  .directive('hs.mickaFiltersDirective', mickaFiltersDirective)

  /**
   * @ngdoc service
   * @name HsMickaFiltersService
   * @memberof hs.datasource_selector
   * @description Service for calling catalogue loaders and managing layers -
   * initiating adding to map, downloading, storing layer extents
   */
  .service(
    'HsDatasourceBrowserService',
    downgradeInjectable(HsDatasourcesService)
  )

  /**
   * @module hs.datasource_selector
   * @name HsDataSourceSelectorMapService
   * @ngdoc controller
   * @description Service of composition module which deal ith OpenLayers map objects
   */
  .service(
    'HsDataSourceSelectorMapService',
    downgradeInjectable(HsDatasourcesMapService)
  )

  /**
   * @ngdoc service
   * @name HsMickaFiltersService
   * @memberof hs.datasource_selector
   * @description Service for managing micka query filter parameters and
   * their possible values i.e. suggestions
   */
  .factory('HsMickaFiltersService', HsMickaFilterService)

  /**
   * @ngdoc service
   * @name HsMickaBrowserService
   * @memberof hs.datasource_selector
   * @description Service for querying layer from Micka metadata catalogue
   */
  .factory('HsMickaBrowserService', HsMickaBrowserService)

  /**
   * @ngdoc service
   * @name HsLaymanBrowserService
   * @memberof hs.datasource_selector
   * @description Service for querying layer from Layman
   */
  .factory('HsLaymanBrowserService', HsLaymanBrowserService)

  /**
   * @ngdoc component
   * @memberof hs.datasource_selector
   * @name hs.datasourceSelector
   * @description Display Datasource selector panel in app. Panel contains datasource types switcher and loaded list of datas.
   */
  .directive(
    'hs.datasourceSelector',
    downgradeComponent({component: HsDatasourcesComponent})
  )

  .component(
    'hsSelectTypeToAddLayerDialog',
    HsSelectTypeToAddLayerDialogComponent
  )

  .filter('forDatasourceBrowser', HsForDatasourceBrowserFilter);

angular.module('hs.datasource-selector', [downgradedDatasourcesModule]);

export {HsDatasourcesModule} from './datasource-selector.module';
