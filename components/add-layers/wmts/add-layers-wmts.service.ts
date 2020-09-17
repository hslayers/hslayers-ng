import moment from 'moment';
global.moment = moment;

/**
 * @param HsMapService
 * @param HsWmtsGetCapabilitiesService
 */
export default function (HsMapService, HsWmtsGetCapabilitiesService) {
  'ngInject';
  /**
   * Add service and its layers to project TODO
   *
   * @memberof add-layers-wms.service_layer_producer
   * @function addService
   * @param {string} url Service url
   * @param {ol/Group} box Openlayers layer group to add the layer to
   */
  this.addService = function (url, box) {
    HsWmtsGetCapabilitiesService.requestGetCapabilities(url, (resp) => {
      const ol_layers = HsWmtsGetCapabilitiesService.service2layers(resp);
      ol_layers.forEach((layer) => {
        if (box !== undefined) {
          box.get('layers').push(layer);
        }
        HsMapService.addLayer(layer, true);
      });
    });
  };
  return this;
}
