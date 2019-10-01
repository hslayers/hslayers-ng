import '../permalink/permalink.module';
import 'components/styles/styles.module';
import searchInputDirective from './search-input.directive';
import searchResultsDirective from './search-results.directive';
import searchService from './search.service';
import searchController from './search.controller';

/**
 * @namespace hs.search
 * @memberOf hs
 */

angular.module('hs.search', ['hs.map', 'hs.styles', 'hs.layout'])
    /**
     * @memberof hs.search
     * @ngdoc directive
     * @name hs.search.directiveSearchinput
     * @description Add search input template to page, with automatic change event and clear button
     */
    .directive('hs.search.directiveSearchinput', searchInputDirective)
    
    .directive('hs.search.directiveSearchresults', searchResultsDirective)
    
     /**
     * @memberof hs.search
     * @ngdoc service
     * @name hs.search.service
     * @description Provides geolocation search request from site selected in config (geonames/sdi4apps) and pass response to handler on success
     */
    .service('hs.search.service', searchService)
    
    /**
     * @memberof hs.search
     * @ngdoc controller
     * @name hs.search.controller
     */
    .controller('hs.search.controller', searchController);
