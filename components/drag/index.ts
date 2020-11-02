import * as angular from 'angular';
import {HsDragModule} from './drag.module';
import {downgrade} from '../../common/downgrader';

export const downgradedModule = downgrade(HsDragModule);
/**
 * @namespace hs.drag
 * @memberOf hs
 */
angular.module(downgradedModule, []);

angular.module('hs.drag', [downgradedModule]);
export {HsDragModule} from './drag.module';
