import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject, finalize, takeUntil} from 'rxjs';

import * as xml2Json from 'xml-js';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source} from 'ol/source';
import {get, transformExtent} from 'ol/proj';

import {AddLayersRecursivelyOptions} from 'hslayers-ng/types';
import {CapabilitiesResponseWrapper} from 'hslayers-ng/types';
import {DuplicateHandling, HsMapService} from 'hslayers-ng/shared/map';
import {HsAddDataCommonService} from '../common.service';
import {HsAddDataUrlService} from './add-data-url.service';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsUrlTypeServiceModel} from 'hslayers-ng/types';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {HsWfsGetCapabilitiesService} from 'hslayers-ng/shared/get-capabilities';
import {LayerOptions} from 'hslayers-ng/types';
import {UrlDataObject} from 'hslayers-ng/types';
import {WfsSource} from './hs.source.WfsSource';
import {setCluster} from 'hslayers-ng/common/extensions';

type WfsCapabilitiesLayer = {
  Abstract: string;
  DefaultCRS: string;
  Keywords: {
    Keyword: string[];
  };
  Name: string;
  Title: string;
  WGS84BoundingBox: {LowerCorner: string; UpperCorner: string};
  _attributes: any;
};

export type HsWfsCapabilitiesLayer = WfsCapabilitiesLayer & {
  featureCount: number;
  limitFeatureCount: boolean;
  loading: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class HsUrlWfsService implements HsUrlTypeServiceModel {
  data: UrlDataObject;
  definedProjections: string[];
  loadingFeatures: boolean;

  private requestCancelSubjects: Map<string, Subject<void>> = new Map();
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
        if (!layerOptions?.fromComposition) {
          this.hsAddDataUrlService.zoomToLayers(this.data);
        }
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
      if (
        this.data.layers.length <= 10 ||
        this.hsAddDataCommonService.layerToSelect
      ) {
        try {
          const layers = this.hsAddDataCommonService.layerToSelect
            ? this.data.layers.filter(
                (l) => l.Name === this.hsAddDataCommonService.layerToSelect,
              )
            : this.data.layers;
          this.getFeatureCountForLayers(
            layers,
            this.hsAddDataCommonService.layerToSelect,
          );
        } catch (e) {
          throw new Error(e);
        }
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
   * Construct and send WFS service getFeature-hits request for a set of layers
   */
  getFeatureCountForLayers(
    layers: HsWfsCapabilitiesLayer[],
    selectedLayer?: string,
  ) {
    for (const layer of layers) {
      layer.loading = true;
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

      this.parseFeatureCount(url, layer, selectedLayer);
    }
  }

  /**
   * Parse layer feature count and set feature limits
   */
  private parseFeatureCount(
    url: string,
    layer: HsWfsCapabilitiesLayer,
    selectedLayer?: string,
  ): void {
    // Create a unique subject for this request
    const cancelSubject = new Subject<void>();

    // Associate the cancel subject with the request URL
    this.requestCancelSubjects.set(url, cancelSubject);

    this.http
      .get(this.hsUtilsService.proxify(url), {responseType: 'text'})
      .pipe(
        takeUntil(this.cancelUrlRequest),
        finalize(() => {
          if (selectedLayer) {
            setCluster(
              layer['olLayer'],
              layer.featureCount ? layer.featureCount > 5000 : true,
            );
          }
        }),
      )
      .subscribe({
        next: (response: any) => {
          const oParser = new DOMParser();
          const oDOM = oParser.parseFromString(response, 'application/xml');
          const doc = oDOM.documentElement;
          layer.featureCount = parseInt(doc.getAttribute('numberOfFeatures'));
          //WFS 2.0.0
          if (layer.featureCount == 0 || !layer.featureCount) {
            layer.featureCount = parseInt(doc.getAttribute('numberMatched'));
          }

          layer.featureCount > 1000
            ? (layer.limitFeatureCount = true)
            : (layer.limitFeatureCount = false);
          layer.loading = false;
          this.requestCancelSubjects.delete(url);
        },
        error: (e) => {
          this.cancelRequest(url);
          layer.featureCount = -9999;
          layer.loading = false;
          //this.hsAddDataCommonService.throwParsingError(e);
        },
      });
  }

  /**
   * Cancel a specific request based on URL as identifier
   */
  private cancelRequest(url: string) {
    const cancelSubject = this.requestCancelSubjects.get(url);
    if (cancelSubject) {
      cancelSubject.next();
      cancelSubject.complete();
      this.requestCancelSubjects.delete(url);
    }
  }

  /**
   * Handle table row click event by getting layer feature count if necessary
   */
  tableLayerChecked($event, layer) {
    if (
      (layer as HsWfsCapabilitiesLayer).featureCount === undefined &&
      layer.checked
    ) {
      this.getFeatureCountForLayers([layer]);
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
    if (!layerOptions?.fromComposition) {
      this.hsAddDataUrlService.zoomToLayers(this.data);
    }
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
    /**
     * Do not cluster features for layer from catalogue now as unlikely
     * we have a hits already. Will be set in parseFeatureCount once the request is completed
     */
    const manyFeatures = this.hsAddDataCommonService.layerToSelect
      ? false
      : layer.featureCount
        ? layer.featureCount > 5000
        : true; //A lot of features or unknown number
    const layerExtent = manyFeatures
      ? this.getLayerExtent(layer, options.crs)
      : undefined;
    const new_layer = new VectorLayer({
      properties: {
        name: options.layerName,
        title: layer.Title.replace(/\//g, '&#47;'),
        removable: true,
        wfsUrl: url,
        ...options,
        extent: layerExtent,
        cluster: manyFeatures,
      },
      source: new WfsSource(this.hsUtilsService, this.http, {
        data_version: this.data.version,
        output_format: this.data.output_format,
        crs: options.crs,
        provided_url: url,
        layer_name: options.layerName,
        map_projection: this.hsMapService.getMap().getView().getProjection(),
        layerExtent: layerExtent,
      }),
      renderOrder: null,
      //Used to determine whether its URL WFS service when saving to compositions
    });
    if (this.hsAddDataCommonService.layerToSelect) {
      layer.olLayer = new_layer;
    }
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
    this.hsLayoutService.setMainPanel('layerManager');
  }
}
