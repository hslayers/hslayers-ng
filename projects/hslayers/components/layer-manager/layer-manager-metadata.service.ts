import {Extent} from 'ol/extent';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {WMSCapabilities, WMTSCapabilities} from 'ol/format';
import {get as getProjection, transformExtent} from 'ol/proj';

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
import {HsAddDataUrlService} from '../add-data/url/add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsDimensionTimeService} from '../../common/get-capabilities/dimension-time.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsUrlWmsService} from '../add-data/url/wms/wms.service';
import {HsWfsGetCapabilitiesService} from '../../common/get-capabilities/wfs-get-capabilities.service';
import {HsWmsGetCapabilitiesService} from '../../common/get-capabilities/wms-get-capabilities.service';
import {
  HsWmsLayer,
  WMSGetCapabilitiesResponse,
  WmsDimension,
} from '../../common/get-capabilities/wms-get-capabilities-response.interface';
import {HsWmtsGetCapabilitiesService} from '../../common/get-capabilities/wmts-get-capabilities.service';

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
    public hsLog: HsLogService,
    public hsUrlWmsService: HsUrlWmsService,
    private hsMapService: HsMapService,
    private hsAddDataUrlService: HsAddDataUrlService,
  ) {}

  /**
   * Recursive callback which identifies object representing added layer in WMS getCapabilities structure.
   * It is used as reference for sublayer structure, metadata
   * @returns Wms layer definition
   */
  identifyLayerObject(
    layerName: string,
    currentLayer: HsWmsLayer,
    serviceLayer: boolean = false,
  ): HsWmsLayer {
    // FIXME: Temporary bypass for layer names like 'UTM:evi'
    /*if (layerName.includes(':')) { //This is wrong because then we are not able to find layer by name
      layerName = layerName.slice(layerName.indexOf(':'));
    }*/
    // NOTE: We are parsing also a top-most layer of the WMS Service, as it is implementation-wise simpler
    if (layerName == currentLayer.Name || serviceLayer) {
      return serviceLayer ? this.getParsedLayers(currentLayer) : currentLayer;
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

  getParsedLayers(layerObject): any {
    const isUsable = layerObject.Layer.every((l) => l.Name); //Sublayers are all queryable
    if (!isUsable) {
      layerObject.Layer =
        this.hsUrlWmsService.filterCapabilitiesLayers(layerObject);
    }
    return layerObject;
  }

  /**
   * Adds hasSublayers parameter if layer has sub-layers
   * @param layerDescriptor - Selected layer
   */
  async fillMetadata(layerDescriptor: HsLayerDescriptor): Promise<void> {
    const layer = layerDescriptor.layer;
    try {
      await this.queryMetadata(layerDescriptor);
    } catch (error) {
      this.hsLog.warn(`Error while querying metadata ${error}`);
    }
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
   * Determines if layer has metadata information available
   * @param layer - Current layer
   */
  hasMetadata(layer: HsLayerDescriptor): boolean {
    if (!layer) {
      return false;
    } else {
      return layer && getMetadata(layer.layer)?.urls ? true : false;
    }
  }

  /**
   * Looks for maxScaleDenominator in property object
   */
  searchForScaleDenominator(properties: any): number {
    let maxResolution = properties.MaxScaleDenominator
      ? this.HsLayerUtilsService.calculateResolutionFromScale(
          properties.MaxScaleDenominator,
        )
      : null;

    //TODO: Currently we are not using minResolution, but should. That would require rewriting this function to return structure of {minRes, maxRes}
    const minResolution = properties.MinScaleDenominator
      ? this.HsLayerUtilsService.calculateResolutionFromScale(
          properties.MinScaleDenominator,
        )
      : 0;

    const layers = properties.Layer;
    if (layers) {
      for (const sublayer of layers) {
        if (sublayer.Layer) {
          const subResolution = this.searchForScaleDenominator(sublayer);
          maxResolution =
            subResolution > maxResolution ? subResolution : maxResolution;
        } else {
          // Set sublayer.maxResolution which is used
          // to display sublayers grayed out or black in layer-editor sublayer tree
          if (sublayer.MaxScaleDenominator) {
            sublayer.maxResolution =
              this.HsLayerUtilsService.calculateResolutionFromScale(
                sublayer.MaxScaleDenominator,
              );
            if (
              maxResolution < sublayer.maxResolution &&
              maxResolution !== null
            ) {
              maxResolution =
                this.HsLayerUtilsService.calculateResolutionFromScale(
                  sublayer.MaxScaleDenominator,
                );
            }
          } else if (!sublayer.maxResolution) {
            sublayer.maxResolution = maxResolution ?? Number.MAX_VALUE;
          }
        }
      }
    }
    if (maxResolution) {
      properties.maxResolution = maxResolution;
    }
    if (minResolution) {
      properties.minResolution = minResolution;
    }
    return maxResolution;
  }
  /**
   * Sets or updates values in layer object
   */
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

  private parseWmsCapsMultipleLayers(
    layerName: string,
    olLayer: Layer<Source>,
    caps: WMSGetCapabilitiesResponse,
    legends: Array<any>,
  ) {
    let layerObj;
    const layerCaps = caps.Capability.Layer;
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
    this.setCapsExtent(
      this.hsAddDataUrlService.calcCombinedExtent(
        layerObjs.map((lo) => this.getCapsExtent(lo)),
      ),
      olLayer,
    );

    if (getCachedCapabilities(olLayer) === undefined) {
      layerObj = Object.assign(JSON.parse(JSON.stringify(layerObjs[0])), {
        maxResolution: Math.max(
          ...layerObjs.map((layer) => this.searchForScaleDenominator(layer)),
        ),
        Layer: layerObjs,
      });
    }
    this.fillMetadataUrlsIfNotExist(olLayer, caps);
    return layerObj;
  }

  private parseWmsCapsSingleLayer(
    layerName: string,
    layerDescriptor: HsLayerDescriptor,
    caps: WMSGetCapabilitiesResponse,
    legends: Array<any>,
  ) {
    const olLayer = layerDescriptor.layer;
    const layerCaps = caps.Capability.Layer;
    const layerObj = this.identifyLayerObject(
      layerName,
      layerCaps,
      olLayer.get('serviceLayer'),
    );
    if (layerObj == undefined) {
      return;
    }
    //TODO: This should be removed probably to not pollute layer object. Use cachedCapabilities instead
    olLayer.setProperties(layerObj);
    if (
      (layerObj.Dimension as WmsDimension)?.name === 'time' ||
      (layerObj.Dimension as WmsDimension[])?.find((dim) => dim.name === 'time')
    ) {
      this.HsDimensionTimeService.setupTimeLayer(layerDescriptor, layerObj);
    }
    if (layerObj.Layer && getSubLayers(olLayer)) {
      layerObj.maxResolution = this.searchForScaleDenominator(layerObj);
      /* layerObj.Layer contains sublayers and gets stored to cachedCapabilities. */
      const subLayerArray = getSubLayers(olLayer).split(',');
      layerObj.Layer = (layerObj.Layer as HsWmsLayer[]).filter((l) =>
        subLayerArray.includes(l.Name),
      );
    }
    if (
      layerObj.queryable &&
      this.HsLayerUtilsService.getLayerParams(olLayer)?.INFO_FORMAT == undefined
    ) {
      this.HsLayerUtilsService.updateLayerParams(olLayer, {
        //TODO: Hslayers needs to support other formats too
        INFO_FORMAT: 'application/vnd.ogc.gml', //Assumption that this will be supported by the server.
      });
    }
    this.collectLegend(layerObj, legends);
    this.setCapsExtent(this.getCapsExtent(layerObj), olLayer);
    return layerObj;
  }

  /**
   * Parse capabilities for WMS layer
   */
  parseWmsCaps(
    layerDescriptor: HsLayerDescriptor,
    layerName: string,
    caps: WMSGetCapabilitiesResponse,
  ): void {
    const olLayer = layerDescriptor.layer;
    const legends: string[] = [];
    let layerObj; //Main object representing layer created from capabilities which will be cached
    if (layerName.includes(',')) {
      layerObj = this.parseWmsCapsMultipleLayers(
        layerName,
        olLayer,
        caps,
        legends,
      );
    } else {
      layerObj = this.parseWmsCapsSingleLayer(
        layerName,
        layerDescriptor,
        caps,
        legends,
      );
    }
    if (getCachedCapabilities(olLayer) === undefined) {
      setCacheCapabilities(olLayer, layerObj);
    }
    this.parseAttribution(olLayer, getCachedCapabilities(olLayer));
    const existingLegends = getLegends(olLayer);
    if (legends.length > 0 && existingLegends == undefined) {
      setLegends(olLayer, legends);
    }
  }

  /**
   * Set layer extent using capabilities layer object
   */
  private setCapsExtent(extent: Extent, layer: Layer<Source>): void {
    if (extent !== null) {
      layer.setExtent(extent);
    }
  }

  /**
   * Helper used in to get usable extent from layers capabilities object
   */
  private getCapsExtent(layerObj: any): Extent {
    let extent = layerObj.EX_GeographicBoundingBox || layerObj.BoundingBox;
    //If from BoundingBox picl one usable
    extent = extent[0].crs
      ? extent.find(
          (e) => e.crs != 'CRS:84' && getProjection(layerObj.BoundingBox[0]),
        )
      : extent;
    return transformExtent(
      //BoundingBox extent is obj with crs, extent, res props
      extent.extent ?? extent,
      //EX_GeographicBoundingBox always in 4326
      extent.crs ?? 'EPSG:4326',
      this.hsMapService.getCurrentProj(),
    );
  }

  private collectLegend(layerObject: any, legends: string[]) {
    const styleWithLegend = layerObject?.Style?.find(
      (style) => style.LegendURL !== undefined,
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
    if (!url || url.length === 0) {
      return;
    }
    //ArcGIS
    if (this.HsLayerUtilsService.isLayerArcgis(layer)) {
      const wrapper = await this.HsArcgisGetCapabilitiesService.request(url);
      if (wrapper.error) {
        return wrapper.response;
      } else {
        this.parseArcGisCaps(layerDescriptor, wrapper.response);
      }
    }
    //WMS
    else if (this.HsLayerUtilsService.isLayerWMS(layer)) {
      const wrapper = await this.HsWmsGetCapabilitiesService.request(url);
      if (wrapper.error) {
        this.hsLog.warn('GetCapabilities call invalid', wrapper.response);
        return wrapper.response;
      }
      const parser = new WMSCapabilities();
      const caps: WMSGetCapabilitiesResponse = parser.read(wrapper.response);
      const params = this.HsLayerUtilsService.getLayerParams(layer);
      const layerNameInParams: string = params.LAYERS;
      this.parseWmsCaps(layerDescriptor, layerNameInParams, caps);
      const sublayers = getSubLayers(layer);
      if (sublayers) {
        if (!(Array.isArray(sublayers) && sublayers.length == 0)) {
          /* When capabilities have been queried, it's safe to override LAYERS
            param now to not render the container layer, but sublayers.*/
          this.HsLayerUtilsService.updateLayerParams(layer, {
            LAYERS: getSubLayers(layer),
          });
        }
      }
      this.fillMetadataUrlsIfNotExist(layer, caps);
      //Identify max resolution of layer. If layer has sublayers the highest value is selected
      setTimeout(() => {
        if (getMaxResolutionDenominator(layer)) {
          layer.setMaxResolution(getMaxResolutionDenominator(layer));
          return;
        }
        const maxResolution = this.searchForScaleDenominator(
          layer.getProperties(),
        );
        if (maxResolution) {
          layer.setMaxResolution(maxResolution);
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
            'application/xml',
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
          /* TODO: maxResolution: Math.max(
            ...layerObjs.map((layer) => this.searchForScaleDenominator(layer))
          ), */
          Layer: layerObjs,
        });
      }
      //TODO: this.fillMetadataUrlsIfNotExist(olLayer, resp);
    } else {
      layerObj = this.identifyArcgisLayerObj(parseInt(layerName), resp);
      if (layerObj == undefined) {
        return;
      }
      /* TODO:
      if (
        layerObj.Dimension?.name === 'time' ||
        layerObj.Dimension?.filter((dim) => dim.name === 'time').length > 0
      ) {
        this.HsDimensionTimeService.setupTimeLayer(layerDescriptor, layerObj);
      } */
      if (layerObj.Layer && getSubLayers(olLayer)) {
        //TODO: layerObj.maxResolution = this.searchForScaleDenominator(layerObj);
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
    },
  ): {Title: string; Name: number; Layer?: {Title: string; Name: number}[]} {
    if (layerId == undefined || isNaN(layerId)) {
      //parseInt(undefined) returns NaN
      return {
        Title: caps.mapName,
        Name: 0,
        Layer: caps?.layers?.map((l) => {
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
