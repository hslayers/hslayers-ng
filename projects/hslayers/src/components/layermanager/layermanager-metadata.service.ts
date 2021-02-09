import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {WMSCapabilities, WMTSCapabilities} from 'ol/format';

import {
  Attribution,
  MetadataUrl,
  getAttribution,
  getCachedCapabilities,
  getMaxResolutionDenominator,
  getMetadata,
  setAttribution,
  setCacheCapabilities,
  setLegends,
  setMetadata,
  getSubLayers,
} from '../../common/layer-extensions';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsWfsGetCapabilitiesService} from '../../common/wfs/get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../common/wms/get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../common/wmts/get-capabilities.service';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerMetadataService {
  constructor(
    public HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public hsLog: HsLogService
  ) {}

  /**
   * @function identifyLayerObject
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

  metadataArray(layer: Layer): Array<MetadataUrl> {
    return getMetadata(layer.layer)?.urls;
  }

  /**
   * Determines if layer has metadata information avaliable *
   * @param layer Current layer
   */
  hasMetadata(layer: HsLayerDescriptor): boolean {
    if (!layer) {
      return false;
    } else {
      return layer && getMetadata(layer.layer)?.urls ? true : false;
    }
  }

  private roundToHundreds(num: number): number {
    return Math.ceil(num / 100) * 100;
  }

  /**
   * @param properties
   * @returns {any}
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
   * @param layer
   * @param key
   * @param values
   * @description Sets or updates values in layer object
   */
  //TODO: TYPES
  setOrUpdate(layer, key, values): void {
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
    layer, //TODO:TYPE
    layer_name: string,
    caps: any,
    fromSublayerParam: boolean
  ): void {
    const layerObject = []; //array of layer objects representing added layer
    if (layer_name.includes(',')) {
      const layers = [];
      const legends: string[] = [];

      const subLayers = layer_name.split(',');
      //loop over layers from layer.LAYERS
      for (let i = 0; i < subLayers.length; i++) {
        layerObject[i] = this.identifyLayerObject(
          subLayers[i],
          caps.Capability.Layer
        );
        const styleWithLegend = layerObject[i].Style.find(
          (style) => style.LegendURL != undefined
        );
        if (styleWithLegend) {
          legends.push(styleWithLegend.LegendURL[0].OnlineResource);
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
      if (getCachedCapabilities(layer) == undefined) {
        setCacheCapabilities(layer, layerObject[0]);
        layer.setProperties(layerObject[0]); //TODO: Remove it later to not mix everything in the same layer object
      }

      this.setOrUpdate(layer, 'Layer', layers);
      setLegends(layer, legends);
      this.fillMetadataUrlsIfNotExist(layer, caps);
    } else {
      layerObject[0] = this.identifyLayerObject(
        layer_name,
        caps.Capability.Layer
      );
      if (getCachedCapabilities(layer) == undefined) {
        setCacheCapabilities(layer, layerObject[0]);
        layer.setProperties(layerObject[0]); //TODO: Remove it later to not mix everything in the same layer object
        this.parseAttribution(layer, layerObject[0]);
      }
      const styleWithLegend = layerObject[0].Style?.find(
        (style) => style.LegendURL != undefined
      );
      if (styleWithLegend) {
        setLegends(layer, styleWithLegend.LegendURL[0].OnlineResource);
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

  parseAttribution(layer: Layer, caps: any) {
    const attr = caps.Attribution;
    if (getAttribution(layer)?.locked || attr == undefined) {
      return;
    }
    const parsedAttribution: Attribution = {
      title: attr.Title,
      onlineResource: attr.OnlineResource,
      logoUrl: attr.LogoURL
        ? {
            format: attr.LogoURL.Format,
            onlineResource: attr.LogoURL.OnlineResource,
          }
        : undefined,
    };
    setAttribution(layer, parsedAttribution);
  }

  /**
   * @function queryMetadata
   * @param {Layer} layer Selected layer
   * @description Callback function, adds getCapabilities response metadata to layer object
   * @returns {Promise}
   */
  async queryMetadata(layer: Layer): Promise<any> {
    const url = this.HsLayerUtilsService.getURL(layer);
    if (!url) {
      return;
    }
    //WMS
    if (this.HsLayerUtilsService.isLayerWMS(layer)) {
      const capabilities = this.HsWmsGetCapabilitiesService.requestGetCapabilities(
        url,
        {castOwsCapabilitiesReceived: false}
      )
        .then((capabilities_xml) => {
          const parser = new WMSCapabilities();
          const caps = parser.read(capabilities_xml);
          const paramLayers: string = layer.getSource().getParams().LAYERS;

          this.parseInfoForLayer(layer, paramLayers, caps, false);
          if (getSubLayers(layer)) {
            this.parseInfoForLayer(layer, getSubLayers(layer), caps, true);

            const src = layer.getSource();
            const params = src.getParams();
            params.LAYERS = params.LAYERS.concat(',', getSubLayers(layer));
            src.updateParams(params);
          }

          this.fillMetadataUrlsIfNotExist(layer, caps);
          //Identify max resolution of layer. If layer has sublayers the heighest value is selected
          setTimeout(() => {
            if (getMaxResolutionDenominator(layer)) {
              layer.set(
                'maxResolution',
                this.roundToHundreds(getMaxResolutionDenominator(layer))
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
          throw e;
          this.hsLog.warn('GetCapabilities call invalid', e);
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
          if (!getAttribution(layer)?.locked) {
            setAttribution(layer, {
              onlineResource: caps.ServiceProvider.ProviderSite,
            });
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
            if (!getAttribution(layer)?.locked) {
              setAttribution(layer, {
                onlineResource: el[0].getAttribute('xlink:href'),
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

  private fillMetadataUrlsIfNotExist(layer: any, caps: any) {
    if (getMetadata(layer) == undefined) {
      setMetadata(layer, {
        urls: [{onlineResource: caps.Service.OnlineResource}],
      });
    }
  }
}
