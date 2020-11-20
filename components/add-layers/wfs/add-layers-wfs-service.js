/* eslint-disable angular/definedundefined */
import * as xml2Json from 'xml-js';
import moment from 'moment';
global.moment = moment;
import {GML as GML3, WFS} from 'ol/format';
import {Vector} from 'ol/source';
import {bbox} from 'ol/loadingstrategy';
import {get, transformExtent} from 'ol/proj';

import '../../../common/get-capabilities.module';
import '../../utils/utils.module';

/**
 * @param HsConfig
 * @param $http
 * @param $document
 * @param $timeout
 */
export class HsAddLayersWfsService {
  constructor(
    HsConfig,
    $http,
    $document,
    $timeout,
    HsUtilsService,
    HsWfsGetCapabilitiesService,
    HsMapService,
    $rootScope
  ) {
    'ngInject';
    Object.assign(this, {
      HsConfig,
      $http,
      $document,
      $timeout,
      HsUtilsService,
      HsWfsGetCapabilitiesService,
      HsMapService,
      $rootScope,
    });

    this.definedProjections = [
      'EPSG:3857',
      'EPSG:5514',
      'EPSG:4258',
      'EPSG:4326',
    ]; //4326 to be added after transforamtion is corrected
  }

  createWfsSource(options) {
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
            version: me.version == '2.0.0' ? '1.1.0' : me.version,
            request: 'GetFeature',
            typeName: options.layer.Name,
            srsName: srs,
            output_format: me.output_format,
            // count: options.layer.limitFeatureCount ? 1000 : '',
            BBOX: extent.join(',') + ',' + srs,
          }),
        ].join('?');

        url = me.HsUtilsService.proxify(url);
        me.$http({
          url: url,
          method: 'GET',
        })
          .then((response) => {
            let featureString, features;
            if (response) {
              featureString = response.data;
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
              this.loadingFeatures = false;
            }
          })
          .catch((e) => {
            throw new Error(e);
          });
      },
    });
    return src;
  }

  async parseCapabilities(response) {
    this.loadingFeatures = false;

    let caps = xml2Json.xml2js(response.data, {compact: true});
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
    this.output_formats = layer.OutputFormats
      ? layer.OutputFormats.Format
      : 'GML3';
    this.bbox = layer.WGS84BoundingBox || layer.OutputFormats.WGS84BoundingBox;

    if (typeof this.output_formats == 'string') {
      this.output_formats = [
        this.version == '2.0.0' ? 'GML2' : this.output_formats,
      ];
    }

    this.output_formats.forEach((format, index) => {
      if (format == 'text/xml; subType=gml/3.1.1/profiles/gmlsf/1.0.0/0') {
        this.output_formats[index] = 'GML3';
      }
    });
    this.output_format = this.getPreferedFormat(this.output_formats);

    this.services = caps.FeatureTypeList.FeatureType[0]
      ? caps.FeatureTypeList.FeatureType
      : [caps.FeatureTypeList.FeatureType];

    const srsType = layer.DefaultSRS ? 'SRS' : 'CRS';
    if (angular.isDefined(layer['Default' + srsType])) {
      this.srss = [layer['Default' + srsType]];
    } else {
      this.srss = new Array();
      this.srss.push('EPSG:4326');
    }

    const otherSRS = layer['Other' + srsType];
    if (typeof otherSRS == 'string') {
      this.srss.push(otherSRS);
    } else {
      angular.forEach(layer['Other' + srsType], (srs) => {
        this.srss.push(srs);
      });
    }

    if (angular.isUndefined(this.srss[0])) {
      this.srss = [caps.FeatureTypeList.FeatureType[0]['Default' + srsType]];
      angular.forEach(
        caps.FeatureTypeList.FeatureType[0]['Other' + srsType],
        (srs) => {
          this.srss.push(srs);
        }
      );
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

    this.$timeout(() => {
      try {
        this.parseFeatureCount();
      } catch (e) {
        this.$rootScope.$broadcast('wfs_capabilities_error', e);
      }
    });
    return this.bbox;
  }

  getPreferedFormat(formats) {
    for (const format of formats) {
      if (format.includes('geojson') || format.includes('GML')) {
        return format;
      }
      return 'GML3';
    }
  }

  parseFeatureCount() {
    angular.forEach(this.services, (service) => {
      const url = [
        this.HsWfsGetCapabilitiesService.service_url.split('?')[0],
        this.HsUtilsService.paramsToURLWoEncode({
          service: 'wfs',
          version: this.version == '2.0.0' ? '1.1.0' : this.version,
          request: 'GetFeature',
          typeName: service.Name,
          resultType: 'hits',
        }),
      ].join('?');

      this.$http({
        url: this.HsUtilsService.proxify(url),
        method: 'GET',
      })
        .then((response) => {
          const oParser = new DOMParser();
          const oDOM = oParser.parseFromString(
            response.data,
            'application/xml'
          );
          const doc = oDOM.documentElement;
          service.featureCount = doc.getAttribute('numberOfFeatures');
          service.featureCount > 1000
            ? (service.limitFeatureCount = true)
            : (service.limitFeatureCount = false);
        })
        .catch((e) => {
          if (e.status == 401) {
            this.$rootScope.$broadcast(
              'wfs_capabilities_error',
              'Unauthorized access. You are not authorized to query data from this service'
            );
            return;
          }
          this.$rootScope.$broadcast('wfs_capabilities_error', e.data);
        });
    });
  }

  parseWFSJson(json) {
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
      throw new Error(
        'GetCapabilities parsing failed. Likely unexpected implementation'
      );
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
    return [...new Set(srss)].filter((srs) =>
      this.definedProjections.includes(srs)
    );
  }

  readFeatures(doc) {
    let features;
    if (this.output_format == 'GML3') {
      const gml = new GML3();
      features = gml.readFeatures(doc, {
        dataProjection: this.srs,
        featureProjection: this.HsMapService.map.getView().getProjection(),
      });
    } else {
      const wfs = new WFS();
      features = wfs.readFeatures(doc, {
        dataProjection: this.srs,
        featureProjection:
          this.HsMapService.map.getView().getProjection().getCode() == this.srs
            ? ''
            : this.HsMapService.map.getView().getProjection(),
      });
    }
    return features;
  }
}
