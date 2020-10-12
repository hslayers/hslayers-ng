import '../layout';
import '../permalink/';
import '../styles/';
import * as angular from 'angular';
import {HsSearchComponent} from './search.component';
import {HsSearchInputComponent} from './search-input.component';
import {HsSearchModule} from './search.module';
import {HsSearchResultsComponent} from './search-results.component';
import {HsSearchService} from './search.service';
import {downgrade} from '../../common/downgrader';
import {downgradeComponent, downgradeInjectable} from '@angular/upgrade/static';

export const downgradedModule = downgrade(HsSearchModule);

/**
 * @namespace hs.search
 * @memberOf hs
 */
angular
  .module(downgradedModule, ['hs.map', 'hs.styles', 'hs.layout'])
  /**
   * @memberof hs.search
   * @ngdoc directive
   * @name hsSearchInput
   * @description Add search input template to page, with automatic change event and clear button
   */
  .directive(
    'hsSearchInput',
    downgradeComponent({component: HsSearchInputComponent})
  )
  .directive(
    'hsSearchResults',
    downgradeComponent({component: HsSearchResultsComponent})
  )
  .directive('hsSearch', downgradeComponent({component: HsSearchComponent}))
  /**
   * @memberof hs.search
   * @ngdoc service
   * @name HsSearchService
   * @description Provides geolocation search request from site selected in config (geonames/sdi4apps) and pass response to handler on success
   */
  .service('HsSearchService', downgradeInjectable(HsSearchService));

angular.module('hs.search', [downgradedModule]);
export {HsSearchModule} from './search.module';
