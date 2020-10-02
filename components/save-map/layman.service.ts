import * as unidecode from 'unidecode';

import {DomSanitizer} from '@angular/platform-browser';
import {GeoJSON, WFS} from 'ol/format';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonEndpointsServiceProvider} from '../../ajs-upgraded-providers';
import {HsLaymanLayerDescriptor} from './layman-layer-descriptor.interface';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaverService} from './saver-service.interface';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';

@Injectable({
  providedIn: 'root',
})
export class HsLaymanService implements HsSaverService {
  crs: string;
  constructor(
    private HsUtilsService: HsUtilsService,
    private http: HttpClient,
    private HsMapService: HsMapService,
    private HsLogService: HsLogService,
    private HsCommonEndpointsService: HsCommonEndpointsService
  ) {}

  /**
   * @function save
   * @memberof HsLaymanService
   * @public
   * @param {JSON} compositionJson Json with composition definition
   * @param {object} endpoint Endpoint description
   * @param {object} compoData Additional fields for composition such
   * @param {boolean} saveAsNew Save as new composition
   * as title, name
   * @returns {Promise<any>} Promise result of POST
   * @description Save composition to Layman
   */
  save(compositionJson, endpoint, compoData, saveAsNew: boolean) {
    return new Promise(async (resolve, reject) => {
      const formdata = new FormData();
      formdata.append(
        'file',
        new Blob([JSON.stringify(compositionJson)], {
          type: 'application/json',
        }),
        'blob.json'
      );
      formdata.append('name', compoData.title);
      formdata.append('title', compoData.title);
      formdata.append('abstract', compoData.abstract);
      const headers = new HttpHeaders();
      headers.append('Content-Type', null);
      headers.append('Accept', 'application/json');
      const options = {
        headers: headers,
      };
      try {
        const response: any = await this.http[saveAsNew ? 'post' : 'patch'](
          `${endpoint.url}/rest/${endpoint.user}/maps${
            saveAsNew
              ? `?${Math.random()}`
              : '/' + this.getLaymanFriendlyLayerName(compoData.title)
          }`,
          formdata,
          options
        ).toPromise();
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * @function pushVectorSource
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} geojson Geojson object with features to send to server
   * @param {object} description Object containing {name, title, crs} of
   * layer to retrieve
   * @param {object} layerDesc Previously fetched layer descriptor
   * @returns {Promise<boolean>} Promise result of POST/PATCH
   * @description Send layer definition and features to Layman
   */
  pushVectorSource(endpoint, geojson, description, layerDesc?) {
    return new Promise(async (resolve, reject) => {
      const formdata = new FormData();
      formdata.append(
        'file',
        new Blob([JSON.stringify(geojson)], {type: 'application/geo+json'}),
        'blob.geojson'
      );
      formdata.append(
        'sld',
        new Blob([], {type: 'application/octet-stream'}),
        ''
      );
      formdata.append('name', description.name);
      formdata.append('title', description.title);
      formdata.append('crs', description.crs);
      const headers = new HttpHeaders();
      headers.append('Content-Type', null);
      headers.append('Accept', 'application/json');
      const options = {
        headers: headers,
      };
      try {
        const layerDesc2 = await this.checkIfLayerExists(
          endpoint,
          description.name,
          layerDesc
        );
        const response: any = await this.http[
          layerDesc2.exists ? 'patch' : 'post'
        ](
          `${endpoint.url}/rest/${endpoint.user}/layers${
            layerDesc2.exists ? '/' + description.name : ''
          }?${Math.random()}`,
          formdata,
          options
        ).toPromise();
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send all features to Layman endpoint as WFS string
   *
   * @memberof HsLayerSynchronizerService
   * @function push
   * @param {Layer} layer Layer to get Layman friendly name for
   * get features
   */
  push(layer: Layer): void {
    if (layer.getSource().loading) {
      return;
    }
    const layerName = this.getLaymanFriendlyLayerName(layer.get('title'));
    let layerTitle = layer.get('title');
    const f = new GeoJSON();
    const geojson = f.writeFeaturesObject(layer.getSource().getFeatures());
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        if (ds.version === undefined || ds.version.split('.').join() < 171) {
          layerTitle = this.getLaymanFriendlyLayerName(layerTitle);
        }
        layer.set('hs-layman-synchronizing', true);
        this.pushVectorSource(ds, geojson, {
          title: layerTitle,
          name: layerName,
          crs: this.crs,
        }).then((response) => {
          setTimeout(() => {
            this.pullVectorSource(ds, layerName, layer).then((response) => {
              layer.set('hs-layman-synchronizing', false);
            });
          }, 2000);
        });
      });
  }

  /**
   * @function addFeature
   * @memberof HsLaymanService
   * @public
   * @param {object} endpoint Endpoint description
   * @param {Array} featuresToAdd Array of features to add
   * @param {Array} featuresToUpd Array of features to update
   * @param {Array} featuresToDel Array of features to delete
   * @param {string} name Name of layer
   * @param {Layer} layer Openlayers layer
   * @returns {Promise<boolean>} Promise result of POST
   * @description Insert a feature
   */
  createWfsTransaction(
    endpoint,
    featuresToAdd,
    featuresToUpd,
    featuresToDel,
    name: string,
    layer: Layer
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.checkIfLayerExists(
        endpoint,
        name,
        layer.get('laymanLayerDescriptor')
      )
        .then((layerDesc: HsLaymanLayerDescriptor) => {
          if (layerDesc?.name) {
            layer.set('laymanLayerDescriptor', layerDesc);
            try {
              const wfsFormat = new WFS();
              const serializedFeature = wfsFormat.writeTransaction(
                featuresToAdd,
                featuresToUpd,
                featuresToDel,
                {
                  featureNS: 'http://' + endpoint.user,
                  featurePrefix: endpoint.user,
                  featureType: name,
                  srsName: this.HsMapService.map
                    .getView()
                    .getProjection()
                    .getCode(),
                }
              );
              const headers = new HttpHeaders();
              headers.append('Content-Type', 'application/xml');
              headers.append('Accept', 'application/xml');
              const httpOptions: any = {
                headers,
                responseType: 'text',
              };
              const body = serializedFeature.outerHTML
                .replace(/<geometry>/gm, '<wkb_geometry>')
                .replace(/<\/geometry>/gm, '</wkb_geometry>');
              this.http
                .post(layerDesc.wfs.url, body, httpOptions)
                .subscribe((response) => {
                  resolve(response);
                });
            } catch (ex) {
              this.HsLogService.error(ex);
            }
          } else {
            this.push(layer);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  /**
   * @function pullVectorSource
   * @memberof HsLaymanService
   * @param layer
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} layerName Object containing {name, title, crs} of
   * layer to retrieve
   * @returns {Promise<string>} Promise with WFS xml (GML3.1) response
   * with features for a specified layer
   * @description Retrieve layers features from server
   */
  async pullVectorSource(
    endpoint,
    layerName: string,
    layer: Layer
  ): Promise<string> {
    const descr: HsLaymanLayerDescriptor = await this.describeLayer(
      endpoint,
      layerName
    );
    if (descr === null) {
      //In case of response?.code == 15
      return null;
    }
    if (descr?.name) {
      layer.set('laymanLayerDescriptor', descr);
    }
    if (
      descr.wfs.status == 'NOT_AVAILABLE' &&
      descr.wms.status == 'NOT_AVAILABLE'
    ) {
      return null;
    }
    if (descr.wfs.status == 'NOT_AVAILABLE') {
      setTimeout(async () => {
        const response = await this.pullVectorSource(
          endpoint,
          layerName,
          layer
        );
        return response;
      }, 2000);
      return;
    }
    try {
      /* When OL will support GML3.2, then we can use WFS
        version 2.0.0. Currently only 3.1.1 is possible */
      const response: string = await this.http
        .get(
          descr.wfs.url +
            '?' +
            this.HsUtilsService.paramsToURL({
              service: 'wfs',
              version: '1.1.0',
              request: 'GetFeature',
              typeNames: `${endpoint.user}:${descr.name}`,
              r: Math.random(),
            }),
          {responseType: 'text'}
        )
        .toPromise();
      return response;
    } catch (ex) {
      return null;
    }
  }

  /**
   * @function describeLayer
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} layerName Layer name
   * @returns {Promise<HsLaymanLayerDescriptor>} Promise which returns layers
   * description containig name, file, wms, wfs urls etc.
   * @description Try getting layer description from layman.
   */
  async describeLayer(
    endpoint,
    layerName: string
  ): Promise<HsLaymanLayerDescriptor> {
    try {
      layerName = this.getLaymanFriendlyLayerName(layerName);
      const response: any = await this.http
        .get(
          `${endpoint.url}/rest/${
            endpoint.user
          }/layers/${layerName}?${Math.random()}`
        )
        .toPromise();
      if (response?.code == 15) {
        return null;
      }
      if (response.name) {
        return response;
      }
    } catch (ex) {
      console.warn(ex);
      return null;
    }
  }

  /**
   * @function checkIfLayerExists
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} layerName Name of layer
   * @param {object} layerDesc Previously loaded layer descriptor
   * @returns {Promise<HsLaymanLayerDescriptor>} Promise which returns boolean if layer
   * exists in Layman
   * @description Try getting layer description from layman. If it
   * succeeds, that means that layer is there and can be updated
   * instead of posting a new one
   */
  checkIfLayerExists(
    endpoint,
    layerName: string,
    layerDesc
  ): Promise<HsLaymanLayerDescriptor> {
    return new Promise((resolve, reject) => {
      if (layerDesc == undefined) {
        this.describeLayer(endpoint, layerName).then(
          (description: HsLaymanLayerDescriptor) => {
            if (description?.code == 15) {
              resolve();
            } else if (description?.name) {
              resolve(description);
            } else {
              resolve();
            }
          }
        );
      } else {
        resolve(layerDesc);
      }
    });
  }

  /**
   * @description Get Layman friendly name for layer based on its title by
   * replacing spaces with underscores, converting to lowercase, etc.
   * see https://github.com/jirik/layman/blob/c79edab5d9be51dee0e2bfc5b2f6a380d2657cbd/src/layman/util.py#L30
   * @function getLaymanFriendlyLayerName
   * @param {string} layerName Name to get Layman-friendly name for
   * @returns {string} New layer title
   */
  getLaymanFriendlyLayerName(layerName: string): string {
    return unidecode(layerName)
      .toLowerCase()
      .replace(/[^\w\s\-\.]/gm, '')
      .trim()
      .replace(/[\s\-\._]+/gm, '_');
  }

  /**
   * @function removeLayer
   * @param layer
   * @public
   * @description Removes selected layer from layman.
   */
  removeLayer(layer: Layer) {
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        this.http
          .delete(
            `${ds.url}/rest/${ds.user}/layers/${layer
              .get('title')
              .toLowerCase()
              .replace(/\s+/g, '')}`
          )
          .toPromise();
      });
  }
    /**
   * @function removeLayer
   * @param layer
   * @public
   * @description Checks whether the layman endpoint exists or not
   */
  laymanEndpointExists() {
    return (
      this.HsCommonEndpointsService.endpoints.findIndex(
        (endpoint) => endpoint.type === 'layman'
      ) >= 0
    );
  }
}
