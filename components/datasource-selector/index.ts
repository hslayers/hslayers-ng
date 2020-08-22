import '../../common/endpoints/endpoints.module';
import '../../common/widgets/widgets.module';
import '../layout';
import * as angular from 'angular';
import {EndpointsWithDatasourcesPipe} from './endpoints-with-datasources.pipe';
import {HsAdvancedMickaDialogComponent} from './micka/advanced-micka-dialog.component';
import {HsDatasourcesComponent} from './datasource-selector.component';
import {HsDatasourcesMapService} from './datasource-selector-map.service';
import {HsDatasourcesModule} from './datasource-selector.module';
import {HsDatasourcesService} from './datasource-selector.service';
import {HsLaymanBrowserService} from './layman/layman.service';
import {HsMetadataDialogComponent} from './metadata-dialog.component';
import {HsMickaBrowserService} from './micka/micka.service';
import {HsMickaFilterComponent} from './micka/micka-filter.component';
import {HsMickaFilterService} from './micka/micka-filters.service';
import {HsMickaSuggestionsDialogComponent} from './micka/micka-suggestions-dialog.component';
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
   * @name hs.datasourceSelector.metadataDialogDirective
   * @memberof hs.datasource_selector
   * @description Directive for displaying metadata about data source
   */
  .directive(
    'hs.datasourceSelector.metadataDialogDirective',
    downgradeComponent({component: HsMetadataDialogComponent})
  )

  /**
   * @name hs.advancedMickaDialog
   * @memberof hs.datasource_selector
   * @description Directive for displaying extended search parameters for
   * Micka catalogue service
   */
  .directive(
    'hs.advancedMickaDialog',
    downgradeComponent({component: HsAdvancedMickaDialogComponent})
  )

  /**
   * @ngdoc directive
   * @name hs.mickaSuggestionsDialog
   * @memberof hs.datasource_selector
   * @description Directive for displaying suggestions for search parameters for Micka catalogue service
   */
  .directive(
    'hs.mickaSuggestionsDialog',
    downgradeComponent({component: HsMickaSuggestionsDialogComponent})
  )

  /**
   * @name hs.mickaFiltersDirective
   * @memberof hs.datasource_selector
   * @description Directive for providing basic html elements for Micka
   * metadata filtering
   */
  .directive(
    'hs.mickaFilters',
    downgradeComponent({component: HsMickaFilterComponent})
  )

  /**
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
   * @description Service of composition module which deal ith OpenLayers map objects
   */
  .service(
    'HsDataSourceSelectorMapService',
    downgradeInjectable(HsDatasourcesMapService)
  )

  /**
   * @name HsMickaFiltersService
   * @memberof hs.datasource_selector
   * @description Service for managing micka query filter parameters and
   * their possible values i.e. suggestions
   */
  .service('HsMickaFiltersService', downgradeInjectable(HsMickaFilterService))

  /**
   * @name HsMickaBrowserService
   * @memberof hs.datasource_selector
   * @description Service for querying layer from Micka metadata catalogue
   */
  .service('HsMickaBrowserService', downgradeInjectable(HsMickaBrowserService))

  /**
   * @name HsLaymanBrowserService
   * @memberof hs.datasource_selector
   * @description Service for querying layer from Layman
   */
  .service(
    'HsLaymanBrowserService',
    downgradeInjectable(HsLaymanBrowserService)
  )

  /**
   * @memberof hs.datasource_selector
   * @name hs.datasourceSelector
   * @description Display Datasource selector panel in app. Panel contains datasource types switcher and loaded list of datas.
   */
  .directive(
    'hs.datasourceSelector',
    downgradeComponent({component: HsDatasourcesComponent})
  )

  .directive(
    'hsSelectTypeToAddLayerDialog',
    downgradeComponent({component: HsSelectTypeToAddLayerDialogComponent})
  );

  //.filter('endpointsWithDatasources', EndpointsWithDatasourcesPipe);

angular.module('hs.datasource-selector', [downgradedDatasourcesModule]);

export {HsDatasourcesModule} from './datasource-selector.module';
