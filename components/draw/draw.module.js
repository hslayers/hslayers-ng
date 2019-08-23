import { Style, Icon, Stroke, Fill, Circle } from 'ol/style';
import 'components/map/map.module';
import 'core'
import 'components/utils/utils.module'
import 'geolocation';
import drawService from './draw.service';

/**
* @namespace hs.draw
* @memberOf hs
*/

angular.module('hs.draw', ['hs.map', 'hs.core', 'hs.utils'])
    .service('hs.draw.service', drawService)
