import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsWfsGetCapabilitiesService} from '../../common/wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../common/wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../common/wmts/get-capabilities.service';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {WMSCapabilities, WMTSCapabilities} from 'ol/format';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerMetadataService {
  constructor(
    private HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    private HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    private HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    private HsLayerUtilsService: HsLayerUtilsService
  ) {}

  /**
   * @function identifyLayerObject
   * @memberOf HsLayermanagerMetadata.service
   * @param layerName
   * @param {Layer} currentLayer Selected layer
   * @description Recursive callback which identifies object representing added layer in WMS getCapabilities structure.
   * It is used as reference for sublayer structure, metadata
   */
  identifyLayerObject(layerName, currentLayer: Layer) {
    if (layerName == currentLayer.Name) {
      return currentLayer;
    } else {
      for (const index in currentLayer.Layer) {
        const node = currentLayer.Layer[index];
        if (node.Name == layerName) {
          return node;
        } else {
          const result = this.identifyLayerObject(layerName, node);
          if (result) {
            return result;
          }
        }
      }
      return false;
    }
  }

  /**
   * @function fillMetadata
   * @memberOf HsLayermanagerMetadata.service
   * @param {Layer} layer Selected layer
   * @description Async adds hasSublayers parameter if true
   */
  async fillMetadata(layer: Layer) {
    await this.queryMetadata(layer);
    const subLayers = layer.get('Layer');
    if (subLayers != undefined && subLayers.length > 0) {
      if (!layer.hasSublayers) {
        layer.hasSublayers = true;
        //ADD config values
      }
    }
  }

  metadataArray(layer: Layer): Array<any> {
    const obj = layer.layer.get('MetadataURL');
    return Object.entries(obj).map((e) => e[1]);
  }

  private roundToHundreds(num: number): number {
    return Math.ceil(num / 100) * 100;
  }

  /**
   * @param properties
   * @function queryMetadata
   * @memberOf HsLayermanagerMetadata.service
   * @description Looks for maxScaleDenominator in property object
   */
  searchForScaleDenominator(properties: any) {
    let maxScale = properties.MaxScaleDenominator
      ? properties.MaxScaleDenominator
      : null;

    const layers = properties.Layer;
    if (layers) {
      for (const sublayer of layers) {
        if (sublayer.Layer) {
          const subScale = this.searchForScaleDenominator(sublayer);
          maxScale = subScale > maxScale ? subScale : maxScale;
        } else {
          if (sublayer.MaxScaleDenominator) {
            sublayer.maxResolution = sublayer.MaxScaleDenominator;
            if (maxScale < sublayer.MaxScaleDenominator) {
              maxScale = sublayer.MaxScaleDenominator;
            }
          } else if (!sublayer.maxResolution) {
            sublayer.maxResolution = maxScale;
          }
        }
      }
    }
    if (maxScale) {
      properties.maxResolution = maxScale;
    }
    return maxScale;
  }
  /**
   * @param properties
   * @function queryMetadata
   * @memberOf HsLayermanagerMetadata.service
   * @description Sets or updates values in layer object
   */

  //TODO TYPES
  setOrUpdate(layer, key, values) {
    const previousValue = layer.get(key);
    if (previousValue) {
      for (const value of values) {
        layer.set(previousValue.push(value));
      }
    } else {
      layer.set(key, values);
    }
  }

  parseInfoForLayer(
    layer, //TODOTYPE
    layer_name: any,
    caps: any,
    fromSublayerParam: boolean
  ) {
    const layerObject = []; //array of layer objects representing added layer

    if (layer_name.includes(',')) {
      const layers = [];
      const legends = [];

      layer_name = layer_name.split(',');
      //loop over layers from layer.LAYERS
      for (let i = 0; i < layer_name.length; i++) {
        layerObject[i] = this.identifyLayerObject(
          layer_name[i],
          caps.Capability.Layer
        );
        if (layerObject[i].Style) {
          legends.push(layerObject[i].Style[0].LegendURL[0].OnlineResource);
        }
        if (layerObject[i].Layer !== undefined) {
          if (fromSublayerParam) {
            delete layerObject[i].Layer;
            layers.push(layerObject[i]);
          } else {
            //loop over sublayers of layer from layer.LAYERS
            for (let j = 0; j < layerObject[i].Layer.length; j++) {
              layers.push(layerObject[i].Layer[j]); //merge sublayers
            }
          }
        }
        layerObject[i].maxResolution = this.searchForScaleDenominator(
          layerObject[i]
        );
      }
      if (!layer.paramsSet) {
        layer.setProperties(layerObject[0]);
        layer.paramsSet = true;
      }
      this.setOrUpdate(layer, 'Layer', layers);
      this.setOrUpdate(layer, 'Legends', legends);
      this.setOrUpdate(layer, 'MetadataURL', {
        //use service metadata for layers with multiple layer.LAYERS inputs
        '0': caps.Service,
      });
    } else {
      layerObject[0] = this.identifyLayerObject(
        layer_name,
        caps.Capability.Layer
      );

      if (!layer.paramsSet) {
        layer.setProperties(layerObject[0]);
        layer.paramsSet = true;
      }
      if (layerObject[0].Style) {
        layer.set(
          'Legends',
          layerObject[0].Style[0].LegendURL[0].OnlineResource
        );
      }

      if (layerObject[0].Layer && fromSublayerParam) {
        layerObject[0].maxResolution = this.searchForScaleDenominator(
          layerObject[0]
        );
        delete layerObject[0].Layer;
        this.setOrUpdate(layer, 'Layer', layerObject);
      }
    }
  }

  /**
   * @function queryMetadata
   * @memberOf HsLayermanagerMetadata.service
   * @param {Layer} layer Selected layer
   * @description Callback function, adds getCapabilities response metadata to layer object
   */
  async queryMetadata(layer: Layer) {
    const url = this.HsLayerUtilsService.getURL(layer);
    const metadata = {
      metainfo: {'OnlineResource': layer.get('Metadata')},
    };
    //WMS
    if (this.HsLayerUtilsService.isLayerWMS(layer)) {
      const capabilities = this.HsWmsGetCapabilitiesService.requestGetCapabilities(
        url
      )
        .then((capabilities_xml) => {
          const parser = new WMSCapabilities();
          const caps = parser.read(capabilities_xml);
          const layer_name = layer.getSource().getParams().LAYERS;
          const layer_name_params = layer.getSource().getParams().LAYERS;

          this.parseInfoForLayer(layer, layer_name_params, caps, false);
          if (layer.get('sublayers')) {
            this.parseInfoForLayer(layer, layer.get('sublayers'), caps, true);

            const src = layer.getSource();
            const params = src.getParams();
            params.LAYERS = params.LAYERS.concat(',', layer.get('sublayers'));
            src.updateParams(params);
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
          if (layer.get('Layer')[0].MetadataURL == undefined){
            layer.set('MetadataURL', {
              '0': caps.Service,
            });
          }
          //Identify max resolution of layer. If layer has sublayers the heighest value is selected
          setTimeout(() => {
            if (layer.get('MaxScaleDenominator')) {
              layer.set(
                'maxResolution',
                this.roundToHundreds(layer.get('MaxScaleDenominator'))
              );
              return;
            }
            const maxScale = this.searchForScaleDenominator(
              layer.getProperties()
            );
            if (maxScale) {
              layer.set('maxResolution', this.roundToHundreds(maxScale));
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
    else if (this.HsLayerUtilsService.isLayerWMTS(layer)) {
      const capabilities = this.HsWmtsGetCapabilitiesService.requestGetCapabilities(
        url
      )
        .then((capabilities_xml) => {
          const parser = new WMTSCapabilities();
          const caps = parser.read(capabilities_xml);
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
    else if (this.HsLayerUtilsService.isLayerVectorLayer(layer)) {
      if (url) {
        const capabilities = this.HsWfsGetCapabilitiesService.requestGetCapabilities(
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
  }
}
