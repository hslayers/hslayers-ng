import * as xml2Json from 'xml-js';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Renderer2, RendererFactory2} from '@angular/core';
import {Subject} from 'rxjs';
import {Vector} from 'ol/source';
import {WFS} from 'ol/format';
import {bbox} from 'ol/loadingstrategy';
import {get, transformExtent} from 'ol/proj';
import VectorLayer from 'ol/layer/Vector';

import {HsConfig} from '../../../../config.service';
import {HsDialogContainerService} from '../../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsGetCapabilitiesErrorComponent} from '../../common/capabilities-error-dialog.component';
import {HsLanguageService} from '../../../language/language.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsLogService} from '../../../../common/log/log.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {HsWfsGetCapabilitiesService} from '../../../../common/wfs/get-capabilities.service';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataWfsService {
  private renderer: Renderer2;
  wfsCapabilitiesError: Subject<any> = new Subject();

  definedProjections: string[];
  version: any;
  output_format: any;
  loadingFeatures: boolean;
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
    public HsConfig: HsConfig,
    private http: HttpClient,
    public HsUtilsService: HsUtilsService,
    public HsWfsGetCapabilitiesService: HsWfsGetCapabilitiesService,
    public HsMapService: HsMapService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsEventBusService: HsEventBusService,
    public HsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public HsLanguageService: HsLanguageService,
    rendererFactory: RendererFactory2
  ) {
    this.renderer = rendererFactory.createRenderer(null, null);

    this.definedProjections = [
      'EPSG:3857',
      'EPSG:5514',
      'EPSG:4258',
      'EPSG:4326',
    ];

    this.HsEventBusService.olMapLoads.subscribe(() => {
      this.mapProjection = this.HsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
    });

    this.HsEventBusService.owsCapabilitiesReceived.subscribe(
      async ({type, response}) => {
        if (type === 'WFS') {
          try {
            const bbox = await this.parseCapabilities(response);
            if (this.layerToAdd) {
              for (const layer of this.services) {
                //TODO: If Layman allows layers with different casing,
                // then remove the case lowering
                if (
                  layer.Title.toLowerCase() === this.layerToAdd.toLowerCase()
                ) {
                  layer.checked = true;
                }
              }
              this.addLayers(true);
              this.layerToAdd = null;
              this.zoomToBBox(bbox);
            }
          } catch (e) {
            if (e.status == 401) {
              this.wfsCapabilitiesError.next(
                'Unauthorized access. You are not authorized to query data from this service'
              );
              return;
            }
            this.wfsCapabilitiesError.next(e);
          }
        }
        if (type === 'error') {
          this.wfsCapabilitiesError.next(response.message);
        }
      }
    );

    this.wfsCapabilitiesError.subscribe((e) => {
      this.hsLog.warn(e);
      this.url = null;
      this.showDetails = false;

      let error = e.toString();
      if (error.includes('property')) {
        error = this.HsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS',
          'serviceTypeNotMatching'
        );
      }
      this.HsDialogContainerService.create(
        HsGetCapabilitiesErrorComponent,
        error
      );
      //throw "WMS Capabilities parsing problem";
    });
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
          me.HsUtilsService.paramsToURLWoEncode({
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

        url = me.HsUtilsService.proxify(url);
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

      setTimeout(() => {
        try {
          this.parseFeatureCount();
        } catch (e) {
          this.wfsCapabilitiesError.next(e);
        }
      });
      return this.bbox;
    } catch (e) {
      this.wfsCapabilitiesError.next(e);
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
        this.HsWfsGetCapabilitiesService.service_url.split('?')[0],
        this.HsUtilsService.paramsToURLWoEncode({
          service: 'wfs',
          version: this.version, //== '2.0.0' ? '1.1.0' : this.version,
          request: 'GetFeature',
          typeName: service.Name,
          resultType: 'hits',
        }),
      ].join('?');

      this.http
        .get(this.HsUtilsService.proxify(url), {responseType: 'text'})
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
              this.wfsCapabilitiesError.next(
                'Unauthorized access. You are not authorized to query data from this service'
              );
              return;
            }
            this.wfsCapabilitiesError.next(e.data);
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
        this.HsMapService.map.getView().getProjection().getCode() == this.srs
          ? ''
          : this.HsMapService.map.getView().getProjection(),
    });
    return features;
  }

  /**
   * @function addLayers
   * @description First step in adding layers to the map. Lops through the list of layers and calls addLayer.
   * @param {boolean} checkedOnly Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean): void {
    this.addAll = checkedOnly;
    for (const layer of this.services) {
      this.addLayersRecursively(layer);
    }
  }

  addLayersRecursively(layer): void {
    if (!this.addAll || layer.checked) {
      this.addLayer(
        layer,
        layer.Title.replace(/\//g, '&#47;'),
        this.HsUtilsService.undefineEmptyString(this.folderName),
        this.srs
      );
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer);
      }
    }
  }

  /**
   * @function addLayer
   * @private
   * @description (PRIVATE) Add selected layer to map???
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} folder name
   * @param {OpenLayers.Projection} srs of the layer
   */
  private addLayer(layer, layerName: string, folder: string, srs): void {
    const options = {
      layer: layer,
      url: this.HsWfsGetCapabilitiesService.service_url.split('?')[0],
      strategy: bbox,
      srs: srs,
    };

    const new_layer = new VectorLayer({
      title: layerName,
      source: this.createWfsSource(options),
      path: folder,
      renderOrder: null,
      removable: true,
    });
    this.HsMapService.map.addLayer(new_layer);
    this.HsLayoutService.setMainPanel('layermanager');
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
    const extent = transformExtent(bbox, 'EPSG:4326', this.mapProjection);
    if (extent) {
      this.HsMapService.map
        .getView()
        .fit(extent, this.HsMapService.map.getSize());
    }
  }
}
