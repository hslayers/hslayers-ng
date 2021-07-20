import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {WMSCapabilities, WMTSCapabilities} from 'ol/format';

import {
  Attribution,
  MetadataUrl,
  getAttribution,
  getCachedCapabilities,
  getLegends,
  getMaxResolutionDenominator,
  getMetadata,
  getSubLayers,
  setAttribution,
  setCacheCapabilities,
  setLegends,
  setMetadata,
} from '../../common/layer-extensions';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerManagerWmstService} from './layermanager-wmst.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsWfsGetCapabilitiesService} from '../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../common/get-capabilities/wms-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../common/get-capabilities/wmts-get-capabilities.service';
import {
  WMSGetCapabilitiesResponse,
  WmsLayer,
} from '../../common/get-capabilities/wms-get-capabilities-response.interface';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerMetadataService {
  constructor(
    public HsWmtsGetCapabilitiesService: HsWmtsGetCapabilitiesService,
    public HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public HsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public HsLayerManagerWmstService: HsLayerManagerWmstService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public hsLog: HsLogService
  ) {}

  /**
   * Recursive callback which identifies object representing added layer in WMS getCapabilities structure.
   * It is used as reference for sublayer structure, metadata
   * @param layerName
   * @param currentLayer
   * @returns Wms layer definition
   */
  identifyLayerObject(layerName: string, currentLayer: WmsLayer): WmsLayer {
    // FIXME: Temporary bypass for layer names like 'UTM:evi'
    /*if (layerName.includes(':')) { //This is wrong because then we are not able to find layer by name
      layerName = layerName.slice(layerName.indexOf(':'));
    }*/
    // NOTE: We are parsing also a top-most layer of the WMS Service, as it is implementationally simpler
    if (layerName == currentLayer.Name) {
      return currentLayer;
    } else if (Array.isArray(currentLayer.Layer)) {
      for (const subLayer of currentLayer.Layer) {
        const found = this.identifyLayerObject(layerName, subLayer);
        if (found) {
          return found;
        }
      }
    } else if (currentLayer.Layer) {
      return this.identifyLayerObject(layerName, currentLayer.Layer);
    }
    return null;
  }

  /**
   * Adds hasSublayers parameter if layer has sub-layers
   * @param layerDescriptor - Selected layer
   */
  async fillMetadata(layerDescriptor: HsLayerDescriptor): Promise<void> {
    const layer = layerDescriptor.layer;
    await this.queryMetadata(layerDescriptor);
    const subLayers = getCachedCapabilities(layer)?.Layer;
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
   * Determines if layer has metadata information available *
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
   * Sets or updates values in layer object
   * @param layer
   * @param key
   * @param values
   */
  //TODO: TYPES
  setOrUpdate(layer: Layer, key, values): void {
    const previousValue = layer.get(key);
    if (previousValue) {
      for (const value of values) {
        layer.set(previousValue.push(value));
      }
    } else {
      layer.set(key, values);
    }
  }

  parseLayerInfo(
    layerDescriptor: HsLayerDescriptor,
    layerName: string,
    caps: WMSGetCapabilitiesResponse
  ): void {
    const olLayer = layerDescriptor.layer;
    const legends: string[] = [];
    const layerCaps = caps.Capability.Layer;
    let layerObj; //Main object representing layer created from capabilities which will be cached
    if (layerName.includes(',')) {
      const layerObjs = []; //array of layer objects representing added layer
      for (const subLayer of layerName.split(',')) {
        const layerSubObject = this.identifyLayerObject(subLayer, layerCaps);
        layerObjs.push(layerSubObject);
        this.collectLegend(layerSubObject, legends);
        if (
          layerSubObject &&
          layerSubObject.Layer !== undefined &&
          getSubLayers(olLayer)
        ) {
          delete layerSubObject.Layer;
        }
      }
      if (getCachedCapabilities(olLayer) === undefined) {
        layerObj = Object.assign(JSON.parse(JSON.stringify(layerObjs[0])), {
          maxResolution: Math.max(
            ...layerObjs.map((layer) => this.searchForScaleDenominator(layer))
          ),
          Layer: layerObjs,
        });
      }
      this.fillMetadataUrlsIfNotExist(olLayer, caps);
    } else {
      layerObj = this.identifyLayerObject(layerName, layerCaps);
      if (layerObj == undefined) {
        return;
      }
      if (
        layerObj.Dimension?.name === 'time' ||
        layerObj.Dimension?.filter((dim) => dim.name === 'time').length > 0
      ) {
        this.HsLayerManagerWmstService.setupTimeLayer(
          layerDescriptor,
          layerObj
        );
      }
      if (layerObj.Layer && getSubLayers(olLayer)) {
        layerObj.maxResolution = this.searchForScaleDenominator(layerObj);
        delete layerObj.Layer;
      }
      this.collectLegend(layerObj, legends);
    }
    if (getCachedCapabilities(olLayer) == undefined) {
      setCacheCapabilities(olLayer, layerObj);
    }
    this.parseAttribution(olLayer, getCachedCapabilities(olLayer));
    const existingLegends = getLegends(olLayer);
    if (legends.length > 0 && existingLegends == undefined) {
      setLegends(olLayer, legends);
    }
  }

  private collectLegend(layerObject: any, legends: string[]) {
    const styleWithLegend = layerObject.Style?.find(
      (style) => style.LegendURL !== undefined
    );
    if (styleWithLegend) {
      legends.push(styleWithLegend.LegendURL[0].OnlineResource);
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
   * Callback function, adds getCapabilities response metadata to layer object
   * @param layerDescriptor - Selected layer
   * @returns Promise
   */
  async queryMetadata(layerDescriptor: HsLayerDescriptor): Promise<any> {
    const layer = layerDescriptor.layer;
    const url = this.HsLayerUtilsService.getURL(layer);
    if (!url) {
      return;
    }
    //WMS
    if (this.HsLayerUtilsService.isLayerWMS(layer)) {
      const capabilities =
        this.HsWmsGetCapabilitiesService.requestGetCapabilities(url, {
          castOwsCapabilitiesReceived: false,
        })
          .then((capabilities_xml) => {
            if (!capabilities_xml) {
              return;
            }
            const parser = new WMSCapabilities();
            const caps: WMSGetCapabilitiesResponse =
              parser.read(capabilities_xml);
            const src = layer.getSource();
            const params = src.getParams();
            const layerNameInParams: string = params.LAYERS;

            this.parseLayerInfo(layerDescriptor, layerNameInParams, caps);
            if (getSubLayers(layer)) {
              params.LAYERS = params.LAYERS.concat(',', getSubLayers(layer));
              src.updateParams(params);
            }

            this.fillMetadataUrlsIfNotExist(layer, caps);
            //Identify max resolution of layer. If layer has sublayers the highest value is selected
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
            this.hsLog.warn('GetCapabilities call invalid', e);
            throw e;
          });
      return capabilities;
    }
    //WMTS
    else if (this.HsLayerUtilsService.isLayerWMTS(layer)) {
      const capabilities =
        this.HsWmtsGetCapabilitiesService.requestGetCapabilities(url)
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
        const capabilities =
          this.HsWfsGetCapabilitiesService.requestGetCapabilities(url)
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
