import '../map/map.module';
import apiService from './api.service';

/**
 * @namespace hs.api
 * @memberOf hs
 */
angular.module('hs.api', ['hs', 'hs.map', 'hs.core'])
    .service("Api", apiService)

    .run(['Api', function (Api) { }]);

