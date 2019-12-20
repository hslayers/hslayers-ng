import { WMSCapabilities } from 'ol/format';
import 'components/utils/utils.module';
import moment from 'moment';
global.moment = moment;
import momentinterval from 'moment-interval/src/moment-interval';
import { Tile, Image as ImageLayer } from 'ol/layer';
import { TileWMS } from 'ol/source';
import { ImageWMS } from 'ol/source';
import { Attribution } from 'ol/control.js';
import { getPreferedFormat } from '../../../common/format-utils';
import { addAnchors } from '../../../common/attribution-utils';

export default ['hs.map.service', 'hs.wmts.getCapabilitiesService', function (OlMap, srv_caps) {
    /**
    * Add service and its layers to project TODO
    * @memberof add-layers-wms.service_layer_producer
    * @function addService
    * @param {String} url Service url
    * @param {} box TODO
    */
    this.addService = function (url, box) {
        srv_caps.requestGetCapabilities(url, function (resp) {
            var ol_layers = srv_caps.service2layers(resp);
            ol_layers.forEach(layer => {
                if (typeof box != 'undefined') box.get('layers').push(layer);
                OlMap.map.addLayer(layer);
            });
        })
    }
}];
