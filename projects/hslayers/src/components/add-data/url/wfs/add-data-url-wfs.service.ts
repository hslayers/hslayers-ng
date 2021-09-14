import * as xml2Json from 'xml-js';
import VectorLayer from 'ol/layer/Vector';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Vector} from 'ol/source';
import {WFS} from 'ol/format';
import {bbox} from 'ol/loadingstrategy';
import {get, transformExtent} from 'ol/proj';

import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {
  HsAddDataUrlTypeServiceInterface,
  addLayerOptions,
  addLayersRecursivelyOptions,
} from '../add-data-url-type-service.interface';
import {HsConfig} from '../../../../config.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataWfsService implements HsAddDataUrlTypeServiceInterface {
  definedProjections: string[];
  data: any;
  url: string;
  showDetails: boolean;
  loadingFeatures: boolean;
  loadingInfo = false;
  layerToSelect: string;
  constructor(
    public hsConfig: HsConfig,
    private http: HttpClient,
    public hsUtilsService: HsUtilsService,
    public hsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public hsMapService: HsMapService,
    public hsEventBusService: HsEventBusService,
    public hsLayoutService: HsLayoutService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService
  ) {
    this.data = {
      mapProjection: undefined,
      version: '',
      output_format: '',
      title: '',
      layers: [],
      output_formats: null,
      bbox: null,
      services: [],
      srss: [],
      srs: null,
      addAll: null,
      folderName: 'WFS',
    };
    this.definedProjections = [
      'EPSG:3857',
      'EPSG:5514',
      'EPSG:4258',
      'EPSG:4326',
    ];

    this.hsEventBusService.olMapLoads.subscribe(() => {
      this.data.mapProjection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });
    this.hsAddDataService.cancelUrlRequest.subscribe(() => {
      this.url = '';
      this.loadingInfo = false;
      this.showDetails = false;
    });
  }

  async addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper,
    sld?: string
  ): Promise<void> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.throwParsingError(wrapper.response.message);
      return;
    }
    try {
      const bbox = await this.parseCapabilities(wrapper.response);
      if (this.layerToSelect) {
        for (const layer of this.data.services) {
          //TODO: If Layman allows layers with different casing,
          // then remove the case lowering
          if (
            layer.Title.toLowerCase() === this.layerToSelect.toLowerCase() ||
            layer.Name.toLowerCase() === this.layerToSelect.toLowerCase()
          ) {
            layer.checked = true;
          }
        }
        this.addLayers(true, sld);
        this.layerToSelect = null;
        this.zoomToBBox(bbox);
      }
    } catch (e) {
      if (e.status == 401) {
        this.throwParsingError(
          'Unauthorized access. You are not authorized to query data from this service'
        );
        return;
      }
      this.throwParsingError(e);
    }
  }

  throwParsingError(e): void {
    this.url = null;
    this.showDetails = false;
    this.loadingInfo = false;
    this.hsAddDataUrlService.addDataCapsParsingError.next(e);
  }

  //FIXME: context
  createWfsSource(options): Vector<Geometry> {
    const me = this;
    const src = new Vector({
      strategy: bbox,
      loader: function (extent, resolution, projection) {
        (<any>this).loadingFeatures = true;
        if (typeof me.data.version == 'undefined') {
          me.data.version = '1.0.0';
        }
        if (typeof me.data.output_format == 'undefined') {
          me.data.output_format = me.data.version == '1.0.0' ? 'GML2' : 'GML3';
        }

        const srs = options.srs.toUpperCase();

        extent = transformExtent(extent, projection.getCode(), srs);
        if (srs.includes('4326') || srs.includes('4258')) {
          extent = [extent[1], extent[0], extent[3], extent[2]];
        }

        let url = [
          options.url,
          me.hsUtilsService.paramsToURLWoEncode({
            service: 'wfs',
            version: me.data.version, // == '2.0.0' ? '1.1.0' : me.version,
            request: 'GetFeature',
            typeName: options.layer.Name,
            srsName: srs,
            output_format: me.data.output_format,
            // count: options.layer.limitFeatureCount ? 1000 : '',
            BBOX: extent.join(',') + ',' + srs,
          }),
        ].join('?');

        url = me.hsUtilsService.proxify(url);
        me.http.get(url, {responseType: 'text'}).subscribe(
          (response: any) => {
            let featureString, features;
            if (response) {
              featureString = response;
            }
            if (featureString) {
              const oParser = new DOMParser();
              const oDOM = oParser.parseFromString(
                featureString,
                'application/xml'
              );
              const doc = oDOM.documentElement;

              features = me.readFeatures(doc);
              (this as VectorSource<Geometry>).addFeatures(features);
              me.loadingFeatures = false;
            }
          },
          (e) => {
            throw new Error(e.message);
          }
        );
      },
    });
    return src;
  }

  /**
   * @param {string} response A stringified XML response to getCapabilities request
   * @returns {Promise}
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
      this.data.title = caps.ServiceIdentification.Title;
      // this.description = addAnchors(caps.ServiceIdentification.Abstract);
      this.data.version = caps.ServiceIdentification.ServiceTypeVersion;
      const layer = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType[0]
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

      if (!this.layerToSelect) {
        setTimeout(() => {
          try {
            this.parseFeatureCount();
          } catch (e) {
            throw new Error(e);
          }
        });
      }
      this.loadingInfo = false;
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
            if (e.status == 401) {
              this.throwParsingError(
                'Unauthorized access. You are not authorized to query data from this service'
              );
              return;
            }
            this.throwParsingError(e);
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

  parseEPSG(srss) {
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

  readFeatures(doc) {
    const wfs = new WFS({version: this.data.version});
    const features = wfs.readFeatures(doc, {
      dataProjection: this.data.srs,
      featureProjection:
        this.hsMapService.map.getView().getProjection().getCode() ==
        this.data.srs
          ? ''
          : this.hsMapService.map.getView().getProjection(),
    });
    return features;
  }

  /**
   * @description First step in adding layers to the map. Lops through the list of layers and calls addLayer.
   * @param {boolean} checkedOnly Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean, sld: string): void {
    this.data.addAll = checkedOnly;
    for (const layer of this.data.services) {
      this.addLayersRecursively(layer, {sld});
    }
  }

  addLayersRecursively(layer, options: addLayersRecursivelyOptions): void {
    if (!this.data.addAll || layer.checked) {
      this.addLayer(layer, {
        layerName: layer.Name,
        folder: this.hsUtilsService.undefineEmptyString(this.data.folderName),
        crs: this.data.srs,
        sld: options.sld,
      });
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer, {sld: options.sld});
      }
    }
  }

  /**
   * @description (PRIVATE) Add selected layer to map???
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} folder name
   * @param {OpenLayers.Projection} srs of the layer
   */
  addLayer(layer, options: addLayerOptions): void {
    const sourceOptions = {
      layer,
      url: this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
      strategy: bbox,
      srs: options.crs,
    };

    const new_layer = new VectorLayer({
      properties: {
        name: options.layerName,
        title: layer.Title.replace(/\//g, '&#47;'),
        path: options.folder,
        removable: true,
        sld: options.sld,
        wfsUrl: this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
      },
      source: this.createWfsSource(sourceOptions),
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
    if (!this.data.mapProjection) {
      this.data.mapProjection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    }
    const extent = transformExtent(bbox, 'EPSG:4326', this.data.mapProjection);
    if (extent) {
      this.hsMapService.fitExtent(extent);
    }
  }
}
