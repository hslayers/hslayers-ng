import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
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
import {HsArcgisGetCapabilitiesService} from '../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsDimensionTimeService} from '../../common/get-capabilities/dimension-time.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsWfsGetCapabilitiesService} from '../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../common/get-capabilities/wms-get-capabilities.service';
import {HsWmtsGetCapabilitiesService} from '../../common/get-capabilities/wmts-get-capabilities.service';
import {Title} from '@angular/platform-browser';
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
    private HsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public HsDimensionTimeService: HsDimensionTimeService,
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
      if (!layerDescriptor.hasSublayers) {
        layerDescriptor.hasSublayers = true;
        //ADD config values
      }
    }
  }

  metadataArray(layer: HsLayerDescriptor): Array<MetadataUrl> {
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

  /**
   * @param properties
   * @returns {any}
   * @description Looks for maxScaleDenominator in property object
   */
  searchForScaleDenominator(properties: any) {
    let maxScale = properties.MaxScaleDenominator
      ? this.HsLayerUtilsService.calculateResolutionFromScale(
          properties.MaxScaleDenominator
        )
      : null;

    const layers = properties.Layer;
    if (layers) {
      for (const sublayer of layers) {
        if (sublayer.Layer) {
          const subScale = this.searchForScaleDenominator(sublayer);
          maxScale = subScale > maxScale ? subScale : maxScale;
        } else {
          if (sublayer.MaxScaleDenominator) {
            sublayer.maxResolution =
              this.HsLayerUtilsService.calculateResolutionFromScale(
                sublayer.MaxScaleDenominator
              );
            if (maxScale < sublayer.MaxScaleDenominator) {
              maxScale = this.HsLayerUtilsService.calculateResolutionFromScale(
                sublayer.MaxScaleDenominator
              );
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
  setOrUpdate(layer: Layer<Source>, key, values): void {
    const previousValue = layer.get(key);
    if (previousValue) {
      for (const value of values) {
        layer.set(key, previousValue.push(value));
      }
    } else {
      layer.set(key, values);
    }
  }

  parseWmsCaps(
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
      //TODO: This should be removed probably to not pollute layer object. Use cachedCapabilities instead
      olLayer.setProperties(layerObj);
      if (
        layerObj.Dimension?.name === 'time' ||
        layerObj.Dimension?.filter((dim) => dim.name === 'time').length > 0
      ) {
        this.HsDimensionTimeService.setupTimeLayer(layerDescriptor, layerObj);
      }
      if (layerObj.Layer && getSubLayers(olLayer)) {
        layerObj.maxResolution = this.searchForScaleDenominator(layerObj);
        /* layerObj.Layer contains sublayers and gets stored to cachedCapabilities. */
        const subLayerArray = getSubLayers(olLayer).split(',');
        layerObj.Layer = layerObj.Layer.filter((l) =>
          subLayerArray.includes(l.Name)
        );
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

  parseAttribution(layer: Layer<Source>, caps: any) {
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
  async queryMetadata(layerDescriptor: HsLayerDescriptor): Promise<boolean> {
    const layer = layerDescriptor.layer;
    const url = this.HsLayerUtilsService.getURL(layer);
    if (!url) {
      return;
    }
    if (this.HsLayerUtilsService.isLayerArcgis(layer)) {
      const wrapper = await this.HsArcgisGetCapabilitiesService.request(url);
      this.parseArcGisCaps(layerDescriptor, wrapper.response);
    } else if (this.HsLayerUtilsService.isLayerWMS(layer)) {
      const wrapper = await this.HsWmsGetCapabilitiesService.request(url);
      if (wrapper.error) {
        this.hsLog.warn('GetCapabilities call invalid', wrapper.response);
      }
      const parser = new WMSCapabilities();
      const caps: WMSGetCapabilitiesResponse = parser.read(wrapper.response);
      const params = this.HsLayerUtilsService.getLayerParams(layer);
      const layerNameInParams: string = params.LAYERS;

      this.parseWmsCaps(layerDescriptor, layerNameInParams, caps);
      if (getSubLayers(layer)) {
        params.LAYERS = params.LAYERS.concat(',', getSubLayers(layer));
        this.HsLayerUtilsService.updateLayerParams(layer, params);
      }

      this.fillMetadataUrlsIfNotExist(layer, caps);
      //Identify max resolution of layer. If layer has sublayers the highest value is selected
      setTimeout(() => {
        if (getMaxResolutionDenominator(layer)) {
          layer.set('maxResolution', getMaxResolutionDenominator(layer));
          return;
        }
        const maxScale = this.searchForScaleDenominator(layer.getProperties());
        if (maxScale) {
          layer.set('maxResolution', maxScale);
        }
      });
      return true;
    }
    //WMTS
    else if (this.HsLayerUtilsService.isLayerWMTS(layer)) {
      const wrapper = await this.HsWmtsGetCapabilitiesService.request(url);
      if (wrapper.error) {
        return wrapper.response;
      } else {
        const parser = new WMTSCapabilities();
        const caps = parser.read(wrapper.response);
        layer.setProperties(caps);
        if (!getAttribution(layer)?.locked) {
          setAttribution(layer, {
            onlineResource: caps.ServiceProvider.ProviderSite,
          });
        }
        return true;
      }
    }
    //WFS and vector
    else if (this.HsLayerUtilsService.isLayerVectorLayer(layer)) {
      if (url) {
        const wrapper = await this.HsWfsGetCapabilitiesService.request(url);
        if (wrapper.error) {
          return wrapper.response;
        } else {
          const parser = new DOMParser();
          const caps = parser.parseFromString(
            wrapper.response.data,
            'application/xml'
          );
          const el = caps.getElementsByTagNameNS('*', 'ProviderSite');
          if (!getAttribution(layer)?.locked) {
            setAttribution(layer, {
              onlineResource: el[0].getAttribute('xlink:href'),
            });
          }
          return true;
        }
      }
    }
  }
  parseArcGisCaps(layerDescriptor: HsLayerDescriptor, resp: any) {
    const olLayer = layerDescriptor.layer;
    const params = this.HsLayerUtilsService.getLayerParams(olLayer);
    const layerName: string = params.LAYERS;
    const legends: string[] = [];
    let layerObj; //Main object representing layer created from capabilities which will be cached
    if (
      layerName !== undefined &&
      (layerName.includes(',') || layerName.includes('show'))
    ) {
      const layerObjs = []; //array of layer objects representing added layer
      for (const subLayer of layerName.replace('show:', '').split(',')) {
        /** This is the found sublayer by ID from the layers array */
        const subObj = this.identifyArcgisLayerObj(parseInt(subLayer), resp);
        layerObjs.push(subObj);
        this.collectLegend(subObj, legends);
        if (subObj && subObj.Layer !== undefined && getSubLayers(olLayer)) {
          delete subObj.Layer;
        }
      }
      if (getCachedCapabilities(olLayer) === undefined) {
        layerObj = Object.assign(JSON.parse(JSON.stringify(layerObjs[0])), {
          /* TODO maxResolution: Math.max(
            ...layerObjs.map((layer) => this.searchForScaleDenominator(layer))
          ), */
          Layer: layerObjs,
        });
      }
      //TODO this.fillMetadataUrlsIfNotExist(olLayer, resp);
    } else {
      layerObj = this.identifyArcgisLayerObj(parseInt(layerName), resp);
      if (layerObj == undefined) {
        return;
      }
      /* TODO 
      if (
        layerObj.Dimension?.name === 'time' ||
        layerObj.Dimension?.filter((dim) => dim.name === 'time').length > 0
      ) {
        this.HsDimensionTimeService.setupTimeLayer(layerDescriptor, layerObj);
      } */
      if (layerObj.Layer && getSubLayers(olLayer)) {
        //TODO layerObj.maxResolution = this.searchForScaleDenominator(layerObj);
        /* layerObj.Layer contains sublayers and gets stored to cachedCapabilities. 
        We delete to not crash interface if the service has thousands of layers. There is an assumption that if we specify sublayers 
        in layer definition, user will not be allowed to display other sublayers 
        thus it is fine if the sublayer list gets hidden in layer editor. */
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
  identifyArcgisLayerObj(
    layerId: number,
    caps: {
      mapName: string;
      layers: {
        id: number;
        name: string;
        parentLayerId?: number;
        defaultVisibility?: boolean;
        subLayerIds?: number[];
        minScale?: number;
        maxScale?: number;
        type?: string;
        geometryType?: string;
      }[];
    }
  ): {Title: string; Name: number; Layer?: {Title: string; Name: number}[]} {
    if (layerId == undefined || isNaN(layerId)) {
      //parseInt(undefined) returns NaN
      return {
        Title: caps.mapName,
        Name: 0,
        Layer: caps.layers.map((l) => {
          return {Title: l.name, Name: l.id};
        }),
      };
    } else {
      const found = caps.layers.find((l) => l.id == layerId);
      if (found) {
        const tmp = {
          Title: found.name,
          Name: found.id,
          Layer: caps.layers
            .filter((l) => l.parentLayerId == layerId)
            .map((l) => {
              return {Title: l.name, Name: l.id};
            }),
        };
        if (tmp.Layer.length == 0) {
          delete tmp.Layer;
        }
        return tmp;
      }
    }
    return null;
  }

  private fillMetadataUrlsIfNotExist(layer: any, caps: any) {
    if (getMetadata(layer) == undefined) {
      setMetadata(layer, {
        urls: [{onlineResource: caps.Service.OnlineResource}],
      });
    }
  }
}
