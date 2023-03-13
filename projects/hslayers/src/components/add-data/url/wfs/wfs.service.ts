import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import * as xml2Json from 'xml-js';
import {Vector as VectorLayer} from 'ol/layer';
import {get, transformExtent} from 'ol/proj';

import WfsSource from '../../../../common/layers/hs.source.WfsSource';
import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {DuplicateHandling, HsMapService} from '../../../map/map.service';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsUrlTypeServiceModel} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject, takeUntil} from 'rxjs';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {urlDataObject} from '../types/data-object.type';

class HsUrlWfsParams {
  data: urlDataObject;
  definedProjections: string[];
  loadingFeatures: boolean;
  constructor() {
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
}

@Injectable({
  providedIn: 'root',
})
export class HsUrlWfsService implements HsUrlTypeServiceModel {
  apps: {
    [id: string]: any;
  } = {default: new HsUrlWfsParams()};

  cancelUrlRequest: Subject<void> = new Subject();

  constructor(
    private http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataCommonService: HsAddDataCommonService,
    private hsAddDataUrlService: HsAddDataUrlService
  ) {}

  get(app: string): HsUrlWfsParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsUrlWfsParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * List and return layers from WFS getCapabilities response
   * @param wrapper - Capabilities response wrapper
   */
  async listLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    app: string,
    style?: string
  ): Promise<Layer<Source>[]> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.hsAddDataCommonService.throwParsingError(
        wrapper.response.message,
        app
      );
      return;
    }
    try {
      await this.parseCapabilities(wrapper.response, app);
      if (this.hsAddDataCommonService.get(app).layerToSelect) {
        this.hsAddDataCommonService.checkTheSelectedLayer(
          this.get(app).data.layers,
          'wfs',
          app
        );
        const collection = this.getLayers(app, true, false, style);
        this.zoomToLayers(app);
        return collection;
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e, app);
    }
  }

  /**
   * Parse information received in WFS getCapabilities response
   * @param response - A stringified XML response to getCapabilities request
   */
  async parseCapabilities(response: string, app: string): Promise<void> {
    try {
      const appRef = this.get(app);
      appRef.loadingFeatures = false;

      appRef.data.map_projection =
        appRef.data.map_projection ??
        this.hsMapService
          .getMap(app)
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
      appRef.data.title = caps.ServiceIdentification.Title || 'Wfs layer';
      // this.description = addAnchors(caps.ServiceIdentification.Abstract);
      appRef.data.version = caps.ServiceIdentification.ServiceTypeVersion;
      const layer = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType.find(
            (layer) =>
              layer.Name == this.hsAddDataCommonService.get(app).layerToSelect
          )
        : caps.FeatureTypeList.FeatureType;
      appRef.data.layers = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType
        : [caps.FeatureTypeList.FeatureType];

      if (layer) {
        appRef.data.extent = this.getLayerExtent(
          layer,
          appRef.data.map_projection,
          app
        );
        layer.WGS84BoundingBox || layer.OutputFormats.WGS84BoundingBox;

        const srsType = layer && layer.DefaultSRS ? 'SRS' : 'CRS';
        if (layer['Default' + srsType] !== undefined) {
          appRef.data.srss = [layer['Default' + srsType]];
        } else {
          appRef.data.srss = [];
          appRef.data.srss.push('EPSG:4326');
        }

        const otherSRS = layer['Other' + srsType];
        if (otherSRS) {
          if (typeof otherSRS == 'string') {
            appRef.data.srss.push(otherSRS);
          } else {
            for (const srs of layer['Other' + srsType]) {
              appRef.data.srss.push(srs);
            }
          }
        }

        if (appRef.data.srss[0] === undefined) {
          appRef.data.srss = [
            caps.FeatureTypeList.FeatureType[0]['Default' + srsType],
          ];
          for (const srs of caps.FeatureTypeList.FeatureType[0][
            'Other' + srsType
          ]) {
            appRef.data.srss.push(srs);
          }
        }
      }
      appRef.data.output_format = this.getPreferredFormat(appRef.data.version);

      appRef.data.srss = this.parseEPSG(appRef.data.srss, app);
      if (appRef.data.srss.length == 0) {
        appRef.data.srss = ['EPSG:3857'];
      }

      appRef.data.srs = (() => {
        for (const srs of appRef.data.srss) {
          if (srs.includes('3857')) {
            return srs;
          }
        }
        return appRef.data.srss[0];
      })();

      if (!this.hsAddDataCommonService.get(app).layerToSelect) {
        setTimeout(() => {
          try {
            this.parseFeatureCount(app);
          } catch (e) {
            throw new Error(e);
          }
        });
      }
      this.hsAddDataCommonService.get(app).loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  getLayerExtent(lyr: any, crs: string, app: string): number[] {
    let bbox = lyr.WGS84BoundingBox || lyr.OutputFormats.WGS84BoundingBox;
    const lowerCorner = bbox.LowerCorner.split(' ').map(Number);
    const upperCorner = bbox.UpperCorner.split(' ').map(Number);
    bbox = [...lowerCorner, ...upperCorner];
    return transformExtent(bbox, 'EPSG:4326', crs);
  }

  /**
   * For given array of layers (service layer definitions) it calculates a cumulative bounding box which encloses all the layers
   */
  calcAllLayersExtent(layers: Layer<Source>[], app: string): any {
    if (layers.length == 0) {
      return undefined;
    }
    const appRef = this.get(app);
    const selectedLayerNames = layers.map((l) => l.get('name'));
    layers = appRef.data.layers.filter((lyr) => {
      return selectedLayerNames.includes(lyr.Name);
    });
    const layerExtents: number[][] = layers.map((lyr) => {
      return this.getLayerExtent(lyr, appRef.data.map_projection, app);
    });
    return this.hsAddDataUrlService.calcCombinedExtent(layerExtents);
  }

  /**
   * Zoom map to one layer or combined layer list extent
   */
  zoomToLayers(app: string): void {
    if (this.get(app).data.extent) {
      this.hsMapService.fitExtent(this.get(app).data.extent, app);
    }
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
  parseFeatureCount(app: string): void {
    const appRef = this.get(app);
    for (const layer of appRef.data.layers) {
      const params = {
        service: 'wfs',
        version: appRef.data.version, //== '2.0.0' ? '1.1.0' : this.version,
        request: 'GetFeature',
        resultType: 'hits',
      };
      params[appRef.data.version.startsWith('1') ? 'typeName' : 'typeNames'] =
        layer.Name;
      const url = [
        this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
        this.hsUtilsService.paramsToURLWoEncode(params),
      ].join('?');

      this.http
        .get(this.hsUtilsService.proxify(url, app), {responseType: 'text'})
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
            this.hsAddDataCommonService.throwParsingError(e, app);
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
  parseEPSG(srss, app: string): Array<any> {
    srss.forEach((srs, index) => {
      const epsgCode = srs.slice(-4);
      srss[index] = 'EPSG:' + epsgCode;
      if (!get(srss[index])) {
        srss.splice(srss.indexOf(index), 1);
      }
    });
    return [...Array.from(new Set(srss))].filter((srs: string) =>
      this.get(app).definedProjections.includes(srs)
    );
  }

  /**
   * Loop through the list of layers and call getLayer
   * @param checkedOnly - Add all available layers or only checked ones. Checked=false=all
   * @param shallow - Wether to go through full depth of layer tree or to stop on first queryable
   */
  getLayers(
    app: string,
    checkedOnly?: boolean,
    shallow: boolean = false,
    style?: string
  ): Layer<Source>[] {
    const appRef = this.get(app);
    appRef.data.add_all = checkedOnly;
    const collection = [];
    for (const layer of appRef.data.layers) {
      this.getLayersRecursively(layer, {style}, collection, app);
    }
    appRef.data.extent = this.calcAllLayersExtent(collection, app);
    this.zoomToLayers(app);
    this.hsAddDataCommonService.clearParams(app);
    this.apps[app] = new HsUrlWfsParams();
    this.hsAddDataCommonService.setPanelToCatalogue(app);
    return collection;
  }

  /**
   * Loop through the list of layers and call getLayer recursively
   * @param layer - Layer selected
   * @param options - Add layers recursively options
   * (checkedOnly?: boolean; style?: string;)
   * @param collection - Layers created and retrieved collection
   */
  getLayersRecursively(
    layer,
    options: addLayersRecursivelyOptions,
    collection: Layer<Source>[],
    app: string
  ): void {
    const appRef = this.get(app);
    if (!appRef.data.add_all || layer.checked) {
      const newLayer = this.getLayer(
        layer,
        {
          layerName: layer.Name,
          folder: this.hsUtilsService.undefineEmptyString(
            appRef.data.folder_name
          ),
          crs: appRef.data.srs,
          sld: options.style?.includes('StyledLayerDescriptor')
            ? options.style
            : undefined,
          qml: options.style?.includes('qgis') ? options.style : undefined,
        },
        app
      );
      collection.push(newLayer);
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.getLayersRecursively(
          sublayer,
          {style: options.style},
          collection,
          app
        );
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
  getLayer(layer, options: addLayerOptions, app: string): Layer<Source> {
    const appRef = this.get(app);
    const new_layer = new VectorLayer({
      properties: {
        name: options.layerName,
        title: layer.Title.replace(/\//g, '&#47;'),
        path: options.folder,
        removable: true,
        sld: options.sld,
        qml: options.qml,
        wfsUrl: this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
        // extent: this.getLayerExtent(layer, options.crs, app),
      },
      source: new WfsSource(
        this.hsUtilsService,
        this.http,
        {
          data_version: appRef.data.version,
          output_format: appRef.data.output_format,
          crs: options.crs,
          provided_url:
            this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
          layer_name: options.layerName,
          map_projection: this.hsMapService
            .getMap(app)
            .getView()
            .getProjection(),
        },
        app
      ),
      renderOrder: null,
      //Used to determine whether its URL WFS service when saving to compositions
    });
    return new_layer;
  }

  /**
   * Loop through the list of layers and add them to the map
   */
  addLayers(layers: Layer<Source>[], app: string): void {
    for (const l of layers) {
      this.hsMapService.resolveDuplicateLayer(
        l,
        app,
        DuplicateHandling.RemoveOriginal
      );
      this.hsMapService.getMap(app).addLayer(l);
    }
    this.hsLayoutService.setMainPanel('layermanager', app);
  }
}
