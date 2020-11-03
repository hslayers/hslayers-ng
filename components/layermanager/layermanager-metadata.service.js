import {WMSCapabilities, WMTSCapabilities} from 'ol/format';

/**
 * @param HsWmtsGetCapabilitiesService
 * @param HsWfsGetCapabilitiesService
 * @param HsWmsGetCapabilitiesService
 * @param $timeout
 * @param HsLayerUtilsService
 * @param HsMapService
 */
export default function (
  HsWmtsGetCapabilitiesService,
  HsWfsGetCapabilitiesService,
  HsWmsGetCapabilitiesService,
  $timeout,
  HsLayerUtilsService
) {
  'ngInject';
  const me = {};
  /**
   * @function identifyLayerObject
   * @memberOf HsLayermanagerMetadata.service
   * @param layerName
   * @param currentLayer
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
   * @memberOf HsLayermanagerMetadata.service
   * @param {Ol.layer} layer Selected layer
   * @description Async adds hasSublayers parameter if true
   */
  me.fillMetadata = async function (layer) {
    await me.queryMetadata(layer);
    const subLayers = layer.get('Layer');
    if (angular.isDefined(subLayers) && subLayers.length > 0) {
      if (!layer.hasSublayers) {
        $timeout(() => {
          layer.hasSublayers = true;
          //ADD config values
        }, 0);
      }
    }
    return true;
  };

  /**
   * Round number to hundrets
   *
   * @param {number} num
   * @returns {number}
   */
  me.roundToHundreds = function (num) {
    return Math.ceil(num / 100) * 100;
  };

  me.searchForScaleDenominator = function (properties) {
    let maxScale = properties.MaxScaleDenominator
      ? properties.MaxScaleDenominator
      : null;

    const layers = properties.Layer;
    if (layers) {
      for (const sublayer of layers) {
        if (sublayer.Layer) {
          const subScale = me.searchForScaleDenominator(sublayer);
          maxScale = subScale > maxScale ? subScale : maxScale;
        } else {
          if (sublayer.MaxScaleDenominator) {
            sublayer.maxResolution = sublayer.MaxScaleDenominator;
            if (maxScale < sublayer.MaxScaleDenominator) {
              maxScale = sublayer.MaxScaleDenominator;
            }
          } else {
            sublayer.maxResolution = maxScale;
          }
        }
      }
    }
    if (maxScale) {
      properties.maxResolution = maxScale;
    }
    return maxScale;
  };
  /**
   * @function queryMetadata
   * @memberOf HsLayermanagerMetadata.service
   * @param {Ol.layer} layer Selected layer
   * @description Callback function, adds getCapabilities response metadata to layer object
   */
  me.queryMetadata = async function (layer) {
    const url = HsLayerUtilsService.getURL(layer);
    const metadata = {
      metainfo: {'OnlineResource': layer.get('Metadata')},
    };
    //WMS
    if (HsLayerUtilsService.isLayerWMS(layer)) {
      const capabilities = HsWmsGetCapabilitiesService.requestGetCapabilities(
        url
      )
        .then((capabilities_xml) => {
          const parser = new WMSCapabilities();
          const caps = parser.read(capabilities_xml);
          let layer_name = layer.getSource().getParams().LAYERS;
          const layerObject = []; //array of layer objects representing added layer

          if (layer_name.includes(',')) {
            const layers = [];
            const legends = [];

            layer_name = layer_name.split(',');
            //loop over layers from layer.LAYERS
            for (let i = 0; i < layer_name.length; i++) {
              layerObject[i] = me.identifyLayerObject(
                layer_name[i],
                caps.Capability.Layer
              );
              if (layerObject[i].Style) {
                legends.push(
                  layerObject[i].Style[0].LegendURL[0].OnlineResource
                );
              }
              if (angular.isDefined(layerObject[i].Layer)) {
                //loop over sublayers of layer from layer.LAYERS
                for (let j = 0; j < layerObject[i].Layer.length; j++) {
                  layers.push(layerObject[i].Layer[j]); //merge sublayers
                }
              }
            }
            layer.setProperties(layerObject[0]);
            layer.set('Layer', layers);
            layer.set('Legends', legends);
            layer.set('MetadataURL', {
              //use service metadata for layers with multiple layer.LAYERS inputs
              '0': caps.Service,
            });
          } else {
            layerObject[0] = me.identifyLayerObject(
              layer_name,
              caps.Capability.Layer
            );
            layer.setProperties(layerObject[0]);
            if (layerObject[0].Style) {
              layer.set(
                'Legends',
                layerObject[0].Style[0].LegendURL[0].OnlineResource
              );
            }
          }

          //prioritize config values
          if (layer.get('Copyright')) {
            layer.set('Attribution', {
              'OnlineResource': layer.get('Copyright'),
            });
          }
          if (layer.get('Metadata')) {
            layer.set('MetadataURL', metadata);
            return layer;
          }
          if (angular.isUndefined(layerObject[0].MetadataURL)) {
            layer.set('MetadataURL', {
              '0': caps.Service,
            });
          }
          //Identify max resolution of layer. If layer has sublayers the heighest value is selected
          $timeout(() => {
            if (layer.get('MaxScaleDenominator')) {
              layer.set(
                'maxResolution',
                me.roundToHundreds(layer.get('MaxScaleDenominator'))
              );
              return;
            }
            const maxScale = me.searchForScaleDenominator(
              layer.getProperties()
            );
            if (maxScale) {
              layer.set('maxResolution', me.roundToHundreds(maxScale));
            }
          });
          return true;
        })
        .catch((e) => {
          console.log('GetCapabilities call invalid', e);
          return e;
        });
      return capabilities;
    }
    //WMTS
    else if (HsLayerUtilsService.isLayerWMTS(layer)) {
      const capabilities = HsWmtsGetCapabilitiesService.requestGetCapabilities(
        url
      )
        .then((capabilities_xml) => {
          const parser = new WMTSCapabilities();
          const caps = parser.read(capabilities_xml.data);
          layer.setProperties(caps);
          if (layer.get('Copyright')) {
            layer.set('Attribution', {
              'OnlineResource': layer.get('Copyright'),
            });
          } else {
            layer.set('Attribution', {
              'OnlineResource': caps.ServiceProvider.ProviderSite,
            });
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
    else if (HsLayerUtilsService.isLayerVectorLayer(layer)) {
      if (url) {
        const capabilities = HsWfsGetCapabilitiesService.requestGetCapabilities(
          url
        )
          .then((capabilities_xml) => {
            const parser = new DOMParser();
            const caps = parser.parseFromString(
              capabilities_xml.data,
              'application/xml'
            );
            const el = caps.getElementsByTagNameNS('*', 'ProviderSite');
            if (layer.get('Copyright')) {
              layer.set('Attribution', {
                'OnlineResource': layer.get('Copyright'),
              });
            } else {
              layer.set('Attribution', {
                'OnlineResource': el[0].getAttribute('xlink:href'),
              });
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
