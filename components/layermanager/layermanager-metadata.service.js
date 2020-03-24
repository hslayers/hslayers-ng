import {WMSCapabilities, WMTSCapabilities} from 'ol/format';

export default ['$rootScope', 'hs.wmts.getCapabilitiesService', 'hs.wfs.getCapabilitiesService', 'hs.wms.getCapabilitiesService', '$timeout', 'hs.utils.layerUtilsService',
  function ($rootScope, WMTSgetCapabilitiesService, WFSgetCapabilitiesService, WMSgetCapabilitiesService, $timeout, layerUtils) {
    const me = {};
    /**
   * @function identifyLayerObject
   * @memberOf hs.layermanager.metadata.service
   * @param {Ol.layer} layer Selected layer
   * @description Recursive callback which identifies object representing added layer in WMS getCapabilities structure.
   * It is used as reference for sublayer structure, metadata
   */
    me.identifyLayerObject = function (layerName, currentLayer) {
      if (layerName == currentLayer.Name) {
        return currentLayer;
      } else {
        for (const index in currentLayer.Layer) {
          const node = currentLayer.Layer[index];
          if (node.Name == layerName) {
            return node;
          } else {
            const result = me.identifyLayerObject(layerName, node);
            if (result) {
              return result;
            }
          }
        }
        return false;
      }
    };

    /**
     * @function fillMetadata
     * @memberOf hs.layermanager.metadata.service
     * @param {Ol.layer} layer Selected layer
     * @description Async adds hasSublayers parameter if true
     */
    me.fillMetadata = function (layer) {
      me.queryMetadata(layer).then(() => {
        const subLayers = layer.get('Layer');
        if (angular.isDefined(subLayers) && subLayers.length > 0) {
          layer.hasSublayers = true;
        }
        $timeout(() => {
          if (!$rootScope.$$phase) {
            $rootScope.$digest();
          }
        }, 0);
      });
    };
    /**
       * @function queryMetadata
       * @memberOf hs.layermanager.metadata.service
       * @param {Ol.layer} layer Selected layer
       * @description Callback function, adds getCapabilities response metadata to layer object
       */
    me.queryMetadata = async function (layer) {
      const url = layerUtils.getURL(layer);
      const metadata = {
        metainfo: {'OnlineResource': layer.get('Metadata')}
      };
      //WMS
      if (layerUtils.isLayerWMS(layer)) {
        const capabilities = WMSgetCapabilitiesService.requestGetCapabilities(url)
          .then((capabilities_xml) => {
            const parser = new WMSCapabilities();
            const caps = parser.read(capabilities_xml);
            const layer_name = (layer.getSource().getParams().LAYERS);

            const layerObject = me.identifyLayerObject(layer_name, caps.Capability.Layer);
            const service = {
              '0': caps.Service
            };

            if (layerObject) {
              layer.setProperties(layerObject);
              if (layer.get('Copyright')) {
                layer.set('Attribution', {'OnlineResource': layer.get('Copyright')});
              }
              if (layer.get('Metadata')) {
                layer.set('MetadataURL', metadata);
                return layer;
              }
              if (angular.isUndefined(layerObject.MetadataURL)) {
                layer.set('MetadataURL', service);
              }
            }

            return true;
          })
          .catch((e) => {
            console.log('GetCapabilities call invalid', e);
            return e;
          });
        return capabilities;
      }
      //WMTS
      else if (layerUtils.isLayerWMTS(layer)) {
        const capabilities = WMTSgetCapabilitiesService.requestGetCapabilities(url)
          .then((capabilities_xml) => {
            const parser = new WMTSCapabilities();
            const caps = parser.read(capabilities_xml.data);
            layer.setProperties(caps);
            if (layer.get('Copyright')) {
              layer.set('Attribution', {'OnlineResource': layer.get('Copyright')});
            } else {
              layer.set('Attribution', {'OnlineResource': caps.ServiceProvider.ProviderSite});
            }
            if (layer.get('Metadata')) {
              layer.set('MetadataURL', metadata);
            }
            return true;
          })
          .catch((error) => {
            return error;
          });
        return capabilities;
      }
      //WFS and vector
      else if (layerUtils.isLayerVectorLayer(layer)) {
        if (url) {
          const capabilities = WFSgetCapabilitiesService.requestGetCapabilities(url)
            .then((capabilities_xml) => {
              const parser = new DOMParser();
              const caps = parser.parseFromString(capabilities_xml.data, 'application/xml');
              const el = caps.getElementsByTagNameNS('*', 'ProviderSite');
              if (layer.get('Copyright')) {
                layer.set('Attribution', {'OnlineResource': layer.get('Copyright')});
              } else {
                layer.set('Attribution', {'OnlineResource': el[0].getAttribute('xlink:href')});
              }
              return true;

            })
            .catch((error) => {
              return error;
            });
          return capabilities;
        }
      }
    };


    return me;
  }
];

