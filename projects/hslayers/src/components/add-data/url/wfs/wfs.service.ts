import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import * as xml2Json from 'xml-js';
import VectorLayer from 'ol/layer/Vector';
import {get, transformExtent} from 'ol/proj';

import WfsSource from '../../../../common/layers/hs.source.WfsSource';
import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataCommonService} from '../../common/common.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUrlTypeServiceModel} from '../models/url-type-service.model';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';
import {addLayerOptions} from '../types/layer-options.type';
import {addLayersRecursivelyOptions} from '../types/recursive-options.type';
import {urlDataObject} from '../types/data-object.type';

@Injectable({
  providedIn: 'root',
})
export class HsUrlWfsService implements HsUrlTypeServiceModel {
  data: urlDataObject;
  definedProjections: string[];
  loadingFeatures: boolean;

  constructor(
    private http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {
    this.setDataToDefault();
    this.definedProjections = [
      'EPSG:3857',
      'EPSG:5514',
      'EPSG:4258',
      'EPSG:4326',
    ];

    this.hsEventBusService.olMapLoads.subscribe(() => {
      this.data.map_projection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });
  }

  setDataToDefault(): void {
    this.data = {
      add_all: null,
      bbox: null,
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
    };
  }

  async addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    style?: string
  ): Promise<void> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.hsAddDataCommonService.throwParsingError(wrapper.response.message);
      return;
    }
    try {
      const bbox = await this.parseCapabilities(wrapper.response);
      if (this.hsAddDataCommonService.layerToSelect) {
        for (const layer of this.data.services) {
          //TODO: If Layman allows layers with different casing,
          // then remove the case lowering
          if (
            layer.Title.toLowerCase() ===
              this.hsAddDataCommonService.layerToSelect.toLowerCase() ||
            layer.Name.toLowerCase() ===
              this.hsAddDataCommonService.layerToSelect.toLowerCase()
          ) {
            layer.checked = true;
          }
        }
        this.addLayers(true, style);
        this.hsAddDataCommonService.layerToSelect = null;
        this.zoomToBBox(bbox);
      }
    } catch (e) {
      this.hsAddDataCommonService.throwParsingError(e);
    }
  }

  /**
   * @param response - A stringified XML response to getCapabilities request
   * @returns
   */
  async parseCapabilities(response: string): Promise<any> {
    try {
      this.loadingFeatures = false;

      let caps: any = xml2Json.xml2js(response, {compact: true});
      if (caps['wfs:WFS_Capabilities']) {
        caps = caps['wfs:WFS_Capabilities'];
      } else {
        caps = caps['WFS_Capabilities'];
      }
      this.parseWFSJson(caps);
      this.data.title = caps.ServiceIdentification.Title || 'Wfs layer';
      // this.description = addAnchors(caps.ServiceIdentification.Abstract);
      this.data.version = caps.ServiceIdentification.ServiceTypeVersion;
      const layer = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType.find(
            (layer) => layer.Name == this.hsAddDataCommonService.layerToSelect
          )
        : caps.FeatureTypeList.FeatureType;
      this.data.layers = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType
        : [caps.FeatureTypeList.FeatureType];
      this.data.bbox =
        layer.WGS84BoundingBox || layer.OutputFormats.WGS84BoundingBox;

      this.data.output_format = this.getPreferredFormat(this.data.version);

      this.data.services = caps.FeatureTypeList.FeatureType[0]
        ? caps.FeatureTypeList.FeatureType
        : [caps.FeatureTypeList.FeatureType];

      const srsType = layer.DefaultSRS ? 'SRS' : 'CRS';
      if (layer['Default' + srsType] !== undefined) {
        this.data.srss = [layer['Default' + srsType]];
      } else {
        this.data.srss = [];
        this.data.srss.push('EPSG:4326');
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
      this.data.srss = this.parseEPSG(this.data.srss);
      if (this.data.srss.length == 0) {
        this.data.srss = ['EPSG:3857'];
      }

      this.data.srs = (() => {
        for (const srs of this.data.srss) {
          if (srs.includes('3857')) {
            return srs;
          }
        }
        return this.data.srss[0];
      })();

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
      return this.data.bbox;
    } catch (e) {
      throw new Error(e);
    }
  }

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

  parseFeatureCount(): void {
    for (const service of this.data.services) {
      const url = [
        this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
        this.hsUtilsService.paramsToURLWoEncode({
          service: 'wfs',
          version: this.data.version, //== '2.0.0' ? '1.1.0' : this.version,
          request: 'GetFeature',
          typeName: service.Name,
          resultType: 'hits',
        }),
      ].join('?');

      this.http
        .get(this.hsUtilsService.proxify(url), {responseType: 'text'})
        .subscribe(
          (response: any) => {
            const oParser = new DOMParser();
            const oDOM = oParser.parseFromString(response, 'application/xml');
            const doc = oDOM.documentElement;
            service.featureCount = doc.getAttribute('numberOfFeatures');
            //WFS 2.0.0
            if (service.featureCount == 0 || !service.featureCount) {
              service.featureCount = doc.getAttribute('numberMatched');
            }

            service.featureCount > 1000
              ? (service.limitFeatureCount = true)
              : (service.limitFeatureCount = false);
          },
          (e) => {
            this.hsAddDataCommonService.throwParsingError(e);
          }
        );
    }
  }

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

  parseEPSG(srss): Array<any> {
    srss.forEach((srs, index) => {
      const epsgCode = srs.slice(-4);
      srss[index] = 'EPSG:' + epsgCode;
      if (!get(srss[index])) {
        srss.splice(srss.indexOf(index), 1);
      }
    });
    return [...Array.from(new Set(srss))].filter((srs: string) =>
      this.definedProjections.includes(srs)
    );
  }

  /**
   * First step in adding layers to the map. Lops through the list of layers and calls addLayer.
   * @param checkedOnly - Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean, style: string): void {
    this.data.add_all = checkedOnly;
    for (const layer of this.data.services) {
      this.addLayersRecursively(layer, {style});
    }
  }

  addLayersRecursively(layer, options: addLayersRecursivelyOptions): void {
    if (!this.data.add_all || layer.checked) {
      this.addLayer(layer, {
        layerName: layer.Name,
        folder: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
        crs: this.data.srs,
        sld: options.style?.includes('StyledLayerDescriptor')
          ? options.style
          : undefined,
        qml: options.style?.includes('qgis') ? options.style : undefined,
      });
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer, {style: options.style});
      }
    }
  }

  /**
   * (PRIVATE) Add selected layer to map???
   * @param layer - capabilities layer object
   * @param layerName - layer name in the map
   * @param folder - name
   * @param srs - of the layer
   */
  addLayer(layer, options: addLayerOptions): void {
    const new_layer = new VectorLayer({
      properties: {
        name: options.layerName,
        title: layer.Title.replace(/\//g, '&#47;'),
        path: options.folder,
        removable: true,
        sld: options.sld,
        qml: options.qml,
        wfsUrl: this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
      },
      source: new WfsSource(this.hsUtilsService, this.http, {
        data_version: this.data.version,
        output_format: this.data.output_format,
        crs: options.crs,
        provided_url:
          this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
        layer: layer,
        layer_name: options.layerName,
        map_projection: this.hsMapService.map.getView().getProjection(),
      }),
      renderOrder: null,
      //Used to determine whether its URL WFS service when saving to compositions
    });
    this.hsMapService.map.addLayer(new_layer);
    this.hsLayoutService.setMainPanel('layermanager');
  }

  private zoomToBBox(bbox: any) {
    if (!bbox) {
      return;
    }
    if (bbox.LowerCorner) {
      bbox = [
        bbox.LowerCorner.split(' ')[0],
        bbox.LowerCorner.split(' ')[1],
        bbox.UpperCorner.split(' ')[0],
        bbox.UpperCorner.split(' ')[1],
      ];
    }
    if (!this.data.map_projection) {
      this.data.map_projection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    }
    const extent = transformExtent(bbox, 'EPSG:4326', this.data.map_projection);
    if (extent) {
      this.hsMapService.fitExtent(extent);
    }
  }
}
