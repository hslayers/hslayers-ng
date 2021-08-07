import * as xml2Json from 'xml-js';
import VectorLayer from 'ol/layer/Vector';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Vector} from 'ol/source';
import {WFS} from 'ol/format';
import {bbox} from 'ol/loadingstrategy';
import {get, transformExtent} from 'ol/proj';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsConfig} from '../../../../config.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/get-capabilities/wfs-get-capabilities.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataWfsService {
  definedProjections: string[];
  version: any;
  output_format: any;
  loadingFeatures: boolean;
  loadingInfo = false;
  title: any;
  layers: any;
  output_formats: any;
  bbox: any;
  services: any;
  srss: any[];
  srs: any;
  addAll: boolean;
  url: string;
  showDetails: boolean;
  mapProjection: any;
  layerToAdd: any;
  folderName = 'WFS';

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
    this.definedProjections = [
      'EPSG:3857',
      'EPSG:5514',
      'EPSG:4258',
      'EPSG:4326',
    ];

    this.hsEventBusService.olMapLoads.subscribe(() => {
      this.mapProjection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });
    this.hsAddDataService.cancelUrlRequest.subscribe(() => {
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
      if (this.layerToAdd) {
        for (const layer of this.services) {
          //TODO: If Layman allows layers with different casing,
          // then remove the case lowering
          if (
            layer.Title.toLowerCase() === this.layerToAdd.toLowerCase() ||
            layer.Name.toLowerCase() === this.layerToAdd.toLowerCase()
          ) {
            layer.checked = true;
          }
        }
        this.addLayers(true, sld);
        this.layerToAdd = null;
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

  throwParsingError(e) {
    this.url = null;
    this.showDetails = false;
    this.loadingInfo = false;
    this.hsAddDataUrlService.addDataCapsParsingError.next(e);
  }

  //FIXME: context
  createWfsSource(options): Vector {
    const me = this;
    const src = new Vector({
      strategy: bbox,
      loader: function (extent, resolution, projection) {
        this.loadingFeatures = true;
        if (typeof me.version == 'undefined') {
          me.version = '1.0.0';
        }
        if (typeof me.output_format == 'undefined') {
          me.output_format = me.version == '1.0.0' ? 'GML2' : 'GML3';
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
            version: me.version, // == '2.0.0' ? '1.1.0' : me.version,
            request: 'GetFeature',
            typeName: options.layer.Name,
            srsName: srs,
            output_format: me.output_format,
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
              this.addFeatures(features);
              me.loadingFeatures = false;
            }
          },
          (e) => {
            throw new Error(e);
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
      this.title = caps.ServiceIdentification.Title;
      // this.description = addAnchors(caps.ServiceIdentification.Abstract);
      this.version = caps.ServiceIdentification.ServiceTypeVersion;
      const layer = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType[0]
        : caps.FeatureTypeList.FeatureType;
      this.layers = Array.isArray(caps.FeatureTypeList.FeatureType)
        ? caps.FeatureTypeList.FeatureType
        : [caps.FeatureTypeList.FeatureType];
      this.bbox =
        layer.WGS84BoundingBox || layer.OutputFormats.WGS84BoundingBox;

      this.output_format = this.getPreferredFormat(this.version);

      this.services = caps.FeatureTypeList.FeatureType[0]
        ? caps.FeatureTypeList.FeatureType
        : [caps.FeatureTypeList.FeatureType];

      const srsType = layer.DefaultSRS ? 'SRS' : 'CRS';
      if (layer['Default' + srsType] !== undefined) {
        this.srss = [layer['Default' + srsType]];
      } else {
        this.srss = [];
        this.srss.push('EPSG:4326');
      }

      const otherSRS = layer['Other' + srsType];
      if (otherSRS) {
        if (typeof otherSRS == 'string') {
          this.srss.push(otherSRS);
        } else {
          for (const srs of layer['Other' + srsType]) {
            this.srss.push(srs);
          }
        }
      }

      if (this.srss[0] === undefined) {
        this.srss = [caps.FeatureTypeList.FeatureType[0]['Default' + srsType]];
        for (const srs of caps.FeatureTypeList.FeatureType[0][
          'Other' + srsType
        ]) {
          this.srss.push(srs);
        }
      }
      this.srss = this.parseEPSG(this.srss);
      if (this.srss.length == 0) {
        this.srss = ['EPSG:3857'];
      }

      this.srs = (() => {
        for (const srs of this.srss) {
          if (srs.includes('3857')) {
            return srs;
          }
        }
        return this.srss[0];
      })();

      if (!this.layerToAdd) {
        setTimeout(() => {
          try {
            this.parseFeatureCount();
          } catch (e) {
            throw new Error(e);
          }
        });
      }
      this.loadingInfo = false;
      return this.bbox;
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
    for (const service of this.services) {
      const url = [
        this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
        this.hsUtilsService.paramsToURLWoEncode({
          service: 'wfs',
          version: this.version, //== '2.0.0' ? '1.1.0' : this.version,
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
    const wfs = new WFS({version: this.version});
    const features = wfs.readFeatures(doc, {
      dataProjection: this.srs,
      featureProjection:
        this.hsMapService.map.getView().getProjection().getCode() == this.srs
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
    this.addAll = checkedOnly;
    for (const layer of this.services) {
      this.addLayersRecursively(layer, sld);
    }
  }

  addLayersRecursively(layer, sld?: string): void {
    if (!this.addAll || layer.checked) {
      this.addLayer(
        layer,
        layer.Name,
        // layer.Title.replace(/\//g, '&#47;'),
        this.hsUtilsService.undefineEmptyString(this.folderName),
        this.srs,
        sld
      );
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer, sld);
      }
    }
  }

  /**
   * @private
   * @description (PRIVATE) Add selected layer to map???
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} folder name
   * @param {OpenLayers.Projection} srs of the layer
   */
  private addLayer(
    layer,
    layerName: string,
    folder: string,
    srs,
    sld?: string
  ): void {
    const options = {
      layer: layer,
      url: this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
      strategy: bbox,
      srs: srs,
    };

    const new_layer = new VectorLayer({
      name: layerName,
      title: layer.Title.replace(/\//g, '&#47;'),
      source: this.createWfsSource(options),
      path: folder,
      renderOrder: null,
      removable: true,
      sld,
      //Used to determine whether its URL WFS service when saving to compositions
      wfsUrl: this.hsWfsGetCapabilitiesService.service_url.split('?')[0],
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
    if (!this.mapProjection) {
      this.mapProjection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    }
    const extent = transformExtent(bbox, 'EPSG:4326', this.mapProjection);
    if (extent) {
      this.hsMapService.map
        .getView()
        .fit(extent, this.hsMapService.map.getSize());
    }
  }
}
