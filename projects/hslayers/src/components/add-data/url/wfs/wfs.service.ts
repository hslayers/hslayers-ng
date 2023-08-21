import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject, takeUntil} from 'rxjs';

import * as xml2Json from 'xml-js';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source} from 'ol/source';
import {get, transformExtent} from 'ol/proj';

import WfsSource from '../../../../common/layers/hs.source.WfsSource';
import {AddLayersRecursivelyOptions} from '../types/recursive-options.type';
import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {DuplicateHandling, HsMapService} from '../../../map/map.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsUrlTypeServiceModel} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';
import {LayerOptions} from '../../../compositions/layer-parser/composition-layer-options.type';
import {UrlDataObject} from '../types/data-object.type';

@Injectable({
  providedIn: 'root',
})
export class HsUrlWfsService implements HsUrlTypeServiceModel {
  data: UrlDataObject;
  definedProjections: string[];
  loadingFeatures: boolean;
  cancelUrlRequest: Subject<void> = new Subject();
  constructor(
    private http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    private hsLog: HsLogService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataCommonService: HsAddDataCommonService,
    private hsAddDataUrlService: HsAddDataUrlService,
  ) {
    this.setDataToDefault();
  }

  /**
   * Sets data object to default
   */
  setDataToDefault() {
    this.data = {
      add_all: null,
      extent: null,
      folder_name: 'WFS',
      layers: [],
      map_projection: undefined,
      output_format: '',
      output_formats: null,
      services: [],
      srs: null,
      srss: [],
      title: '',
      version: '',
      table: {
        trackBy: 'Name',
        nameProperty: 'Title',
      },
    };
    this.definedProjections = [
      'EPSG:3857',
      'EPSG:5514',
      'EPSG:4258',
      'EPSG:4326',
    ];
  }

  /**
   * List and return layers from WFS getCapabilities response
   * @param wrapper - Capabilities response wrapper
   */
  async listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    layerOptions?: LayerOptions,
  ): Promise<Layer<Source>[]> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.hsAddDataCommonService.throwParsingError(wrapper.response.message);
      return;
    }
    try {
      await this.parseCapabilities(wrapper.response);
      if (this.hsAddDataCommonService.layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(
          this.data.layers,
          'wfs',
        );
        const collection = this.getLayers(true, false, layerOptions);
        this.hsAddDataUrlService.zoomToLayers(this.data);
        return collection;
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
    }
  }

  /**
   * Parse information received in WFS getCapabilities response
   * @param response - A stringified XML response to getCapabilities request
   */
  async parseCapabilities(response: string): Promise<void> {
    try {
      this.loadingFeatures = false;

      this.data.map_projection ??= this.hsMapService
        .getMap()
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();

      let caps: any = xml2Json.xml2js(response, {compact: true});
      if (caps['wfs:WFS_Capabilities']) {
        caps = caps['wfs:WFS_Capabilities'];
      } else {
        caps = caps['WFS_Capabilities'];
      }
      this.parseWFSJson(caps);
      const serviceTitle = caps.ServiceIdentification?.Title;
      this.data.title =
        typeof serviceTitle === 'string'
          ? serviceTitle
          : this.hsWfsGetCapabilitiesService.service_url
              .split('//')[1]
              .split('/')[0];
      // this.description = addAnchors(caps.ServiceIdentification.Abstract);
      this.data.version = caps.ServiceIdentification.ServiceTypeVersion;
      const layer = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType.find(
            (layer) => layer.Name == this.hsAddDataCommonService.layerToSelect,
          )
        : caps.FeatureTypeList.FeatureType;
      this.data.layers = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType
        : [caps.FeatureTypeList.FeatureType];

      if (layer) {
        this.data.extent = this.getLayerExtent(layer, this.data.map_projection);
        layer.WGS84BoundingBox || layer.OutputFormats.WGS84BoundingBox;

        const srsType = layer && layer.DefaultSRS ? 'SRS' : 'CRS';
        if (layer['Default' + srsType] !== undefined) {
          this.data.srss = [layer['Default' + srsType]];
        } else {
          this.data.srss = [];
          this.data.srss.push('urn:ogc:def:crs:EPSG::4326');
        }

        const otherSRS = layer['Other' + srsType];
        if (otherSRS) {
          if (typeof otherSRS == 'string') {
            this.data.srss.push(otherSRS);
          } else {
            for (const srs of layer['Other' + srsType]) {
              this.data.srss.push(srs);
            }
          }
        }

        if (this.data.srss[0] === undefined) {
          this.data.srss = [
            caps.FeatureTypeList.FeatureType[0]['Default' + srsType],
          ];
          for (const srs of caps.FeatureTypeList.FeatureType[0][
            'Other' + srsType
          ]) {
            this.data.srss.push(srs);
          }
        }
      }
      this.data.output_format = this.getPreferredFormat(this.data.version);

      const fallbackProj = this.data.map_projection || 'EPSG:3857';
      this.data.srss = this.parseEPSG(this.data.srss);
      if (this.data.srss.length == 0) {
        this.data.srss = [fallbackProj];
        this.hsLog.warn(
          `While loading WFS from ${this.data.title} fallback projection ${fallbackProj} was used.`,
        );
      }

      this.data.srs =
        this.data.srss.find((srs) => srs.includes(fallbackProj)) ||
        this.data.srss[0];

      if (!this.hsAddDataCommonService.layerToSelect) {
        setTimeout(() => {
          try {
            this.parseFeatureCount();
          } catch (e) {
            throw new Error(e);
          }
        });
      }
      this.hsAddDataCommonService.loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  getLayerExtent(lyr: any, crs: string): number[] {
    let bbox = lyr.WGS84BoundingBox || lyr.OutputFormats.WGS84BoundingBox;
    const lowerCorner = bbox.LowerCorner.split(' ').map(Number);
    const upperCorner = bbox.UpperCorner.split(' ').map(Number);
    bbox = [...lowerCorner, ...upperCorner];
    return transformExtent(bbox, 'EPSG:4326', crs);
  }

  /**
   * For given array of layers (service layer definitions) it calculates a cumulative bounding box which encloses all the layers
   */
  calcAllLayersExtent(layers: Layer<Source>[]): any {
    if (layers.length == 0) {
      return undefined;
    }

    const selectedLayerNames = layers.map((l) => l.get('name'));
    layers = this.data.layers.filter((lyr) => {
      return selectedLayerNames.includes(lyr.Name);
    });
    const layerExtents: number[][] = layers.map((lyr) => {
      return this.getLayerExtent(lyr, this.data.map_projection);
    });
    return this.hsAddDataUrlService.calcCombinedExtent(layerExtents);
  }

  /**
   * Get preferred GML version format
   * @param version - GML version
   */
  getPreferredFormat(version: string): string {
    switch (version) {
      case '1.0.0':
        return 'GML2';
      case '1.1.0':
        return 'GML3';
      case '2.0.0':
        return 'GML32';
      default:
        return 'GML3';
    }
  }

  /**
   * Parse layer feature count and set feature limits
   */
  parseFeatureCount(): void {
    for (const layer of this.data.layers) {
      const params = {
        service: 'wfs',
        version: this.data.version, //== '2.0.0' ? '1.1.0' : this.version,
        request: 'GetFeature',
        resultType: 'hits',
      };
      params[this.data.version.startsWith('1') ? 'typeName' : 'typeNames'] =
        layer.Name;
      const url = [
        this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
        this.hsUtilsService.paramsToURLWoEncode(params),
      ].join('?');

      this.http
        .get(this.hsUtilsService.proxify(url), {responseType: 'text'})
        .pipe(takeUntil(this.cancelUrlRequest))
        .subscribe({
          next: (response: any) => {
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(response, 'application/xml');
            const doc = oDOM.documentElement;
            layer.featureCount = doc.getAttribute('numberOfFeatures');
            //WFS 2.0.0
            if (layer.featureCount == 0 || !layer.featureCount) {
              layer.featureCount = doc.getAttribute('numberMatched');
            }

            layer.featureCount > 1000
              ? (layer.limitFeatureCount = true)
              : (layer.limitFeatureCount = false);
          },
          error: (e) => {
            this.cancelUrlRequest.next();
            this.hsAddDataCommonService.throwParsingError(e);
          },
        });
    }
  }
  /**
   * Parse WFS json file
   * @param json - JSON file
   */
  parseWFSJson(json: JSON): void {
    try {
      for (const key of Object.keys(json)) {
        if (key.includes(':')) {
          json[key.substring(4)] = json[key];
          if (typeof json[key.substring(4)] == 'object') {
            this.parseWFSJson(json[key]);
          }
          if (json[key.substring(4)] && json[key.substring(4)]['_text']) {
            json[key.substring(4)] = json[key.substring(4)]['_text'];
          }
          delete json[key];
        }
        if (typeof json[key] == 'object') {
          this.parseWFSJson(json[key]);
          if (json[key] && json[key]['_text']) {
            json[key] = json[key]['_text'];
          }
        }
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * Parse EPSG in usable formats
   * @param srss -
   */
  parseEPSG(srss): Array<any> {
    srss.forEach((srs, index) => {
      const epsgCode = srs.slice(-4);
      srss[index] = 'EPSG:' + epsgCode;
      if (!get(srss[index])) {
        srss.splice(srss.indexOf(index), 1);
      }
    });
    return [...Array.from(new Set(srss))].filter((srs: string) =>
      this.definedProjections.includes(srs),
    );
  }

  /**
   * Loop through the list of layers and call getLayer
   * @param checkedOnly - Add all available layers or only checked ones. Checked=false=all
   * @param shallow - Whether to go through full depth of layer tree or to stop on first queryable
   */
  getLayers(
    checkedOnly?: boolean,
    shallow?: boolean,
    layerOptions?: LayerOptions,
  ): Layer<Source>[] {
    this.data.add_all = checkedOnly;
    const collection = [];
    for (const layer of this.data.layers) {
      this.getLayersRecursively(layer, {layerOptions}, collection);
    }
    this.data.extent = this.calcAllLayersExtent(collection);
    this.hsAddDataUrlService.zoomToLayers(this.data);
    this.hsAddDataCommonService.clearParams();
    this.setDataToDefault();
    this.hsAddDataCommonService.setPanelToCatalogue();
    return collection;
  }

  /**
   * Loop through the list of layers and call getLayer recursively
   * @param layer - Layer selected
   * @param options - Add layers recursively options
   * (checkedOnly?: boolean; style?: string; layerOptions: @type LayerOptions)
   * @param collection - Layers created and retrieved collection
   */
  getLayersRecursively(
    layer,
    options: AddLayersRecursivelyOptions,
    collection: Layer<Source>[],
  ): void {
    const style = options.layerOptions?.style;
    if (!this.data.add_all || layer.checked) {
      const newLayer = this.getLayer(layer, {
        layerName: layer.Name,
        path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
        crs: this.data.srs,
        sld: style?.includes('StyledLayerDescriptor') ? style : undefined,
        qml: style?.includes('qgis') ? style : undefined,
        ...options?.layerOptions,
      });
      collection.push(newLayer);
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.getLayersRecursively(sublayer, options, collection);
      }
    }
  }

  /**
   * Get selected layer
   * @param layer - capabilities layer object
   * @param layerName - layer name in the map
   * @param folder - name
   * @param srs - of the layer
   */
  getLayer(layer, options: LayerOptions): Layer<Source> {
    const url = this.hsWfsGetCapabilitiesService.service_url.split('?')[0];
    const new_layer = new VectorLayer({
      properties: {
        name: options.layerName,
        title: layer.Title.replace(/\//g, '&#47;'),
        removable: true,
        wfsUrl: url,
        ...options,
        // extent: this.getLayerExtent(layer, options.crs),
      },
      source: new WfsSource(this.hsUtilsService, this.http, {
        data_version: this.data.version,
        output_format: this.data.output_format,
        crs: options.crs,
        provided_url: url,
        layer_name: options.layerName,
        map_projection: this.hsMapService.getMap().getView().getProjection(),
      }),
      renderOrder: null,
      //Used to determine whether its URL WFS service when saving to compositions
    });
    return new_layer;
  }

  /**
   * Loop through the list of layers and add them to the map
   */
  addLayers(layers: Layer<Source>[]): void {
    for (const l of layers) {
      this.hsMapService.resolveDuplicateLayer(
        l,
        DuplicateHandling.RemoveOriginal,
      );
      this.hsMapService.getMap().addLayer(l);
    }
    this.hsLayoutService.setMainPanel('layermanager');
  }
}
