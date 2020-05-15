import moment from 'moment';
global.moment = moment;

export default ['HsMapService', 'HsWmtsGetCapabilitiesService', function (OlMap, srv_caps) {
  /**
    * Add service and its layers to project TODO
    * @memberof add-layers-wms.service_layer_producer
    * @function addService
    * @param {String} url Service url
    * @param {ol/Group} box Openlayers layer group to add the layer to
    */
  this.addService = function (url, box) {
    srv_caps.requestGetCapabilities(url, (resp) => {
      const ol_layers = srv_caps.service2layers(resp);
      ol_layers.forEach(layer => {
        if (angular.isDefined(box)) {
          box.get('layers').push(layer);
        }
        OlMap.map.addLayer(layer);
      });
    });
  };
  return this;
}];
