import {GeoJSON, WFS} from 'ol/format';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsLaymanLayerDescriptor} from './layman-layer-descriptor.interface';
import {HsLogService} from '../core/log.service';
import {HsMapService} from '../map/map.service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {SaverServiceInterface} from './saver-service.interface';

export class HsLaymanService implements SaverServiceInterface {
  crs: string;
  constructor(
    private HsUtilsService: HsUtilsService,
    private http: HttpClient,
    private HsMapService: HsMapService,
    private HsLogService: HsLogService,
    private HsCommonEndpointsService: HsCommonEndpointsService
  ) {}

  /**
   * @ngdoc method
   * @function save
   * @memberof HsLaymanService
   * @public
   * @param {string} compositionJson Json with composition definition
   * @param {object} endpoint Endpoint description
   * @param {string} compoData Additional fields for composition such
   * @param {boolean} saveAsNew Save as new composition
   * as title, name
   * @returns {Promise<boolean>} Promise result of POST
   * @description Save composition to Layman
   */
  save(compositionJson, endpoint, compoData, saveAsNew) {
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
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
      });
      const options = {
        headers: headers,
      };
      try {
        const response: any = await this.http[saveAsNew ? 'post' : 'patch'](
          `${endpoint.url}/rest/${endpoint.user}/maps${
            saveAsNew
              ? `?${Math.random()}`
              : '/' + this.urlFriendly(compoData.title)
          }`,
          formdata,
          options
        ).toPromise();
        resolve(response);
      } catch (err) {
        reject(err.data);
      }
    });
  }

  urlFriendly(text) {
    return text.replaceAll(' ', '').toLowerCase();
  }

  /**
   * @ngdoc method
   * @function pushVectorSource
   * @memberof HsLaymanService
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} geojson Geojson object with features to send to server
   * @param {string} description Object containing {name, title, crs} of
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
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
      });
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
        reject(err.data);
      }
    });
  }

  getLayerName(layer) {
    return layer.get('title').toLowerCase().replaceAll(' ', '');
  }

  /**
   * Send all features to Layman endpoint as WFS string
   *
   * @memberof HsLayerSynchronizerService
   * @function push
   * @param {Ol.layer} layer Layer to get Layman friendly name for
   * get features
   */
  push(layer) {
    if (layer.getSource().loading) {
      return;
    }
    const f = new GeoJSON();
    const geojson = f.writeFeaturesObject(layer.getSource().getFeatures());
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        layer.set('hs-layman-synchronizing', true);
        this.pushVectorSource(ds, geojson, {
          title: layer.get('title'),
          name: this.getLayerName(layer),
          crs: this.crs,
        }).then((response) => {
          setTimeout(() => {
            this.pullVectorSource(ds, this.getLayerName(layer)).then(
              (response) => {
                layer.set('hs-layman-synchronizing', false);
              }
            );
          }, 2000);
        });
      });
  }

  /**
   * @ngdoc method
   * @function addFeature
   * @memberof HsLaymanService
   * @public
   * @param {object} endpoint Endpoint description
   * @param {Array} featuresToAdd Array of features to add
   * @param {Array} featuresToUpd Array of features to update
   * @param {Array} featuresToDel Array of features to delete
   * @param {string} name Name of layer
   * @param {ol/Layer} layer Openlayers layer
   * @returns {Promise<boolean>} Promise result of POST
   * @description Insert a feature
   */
  createWfsTransaction(
    endpoint,
    featuresToAdd,
    featuresToUpd,
    featuresToDel,
    name,
    layer
  ) {
    return new Promise((resolve, reject) => {
      this.checkIfLayerExists(
        endpoint,
        name,
        layer.get('laymanLayerDescriptor')
      )
        .then((layerDesc: any) => {
          if (layerDesc.exists) {
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
              const httpOptions = {
                headers: new HttpHeaders({
                  'Content-Type': 'application/xml', //<- To SEND XML
                  'Accept': 'application/xml', //<- To ask for XML
                  'Response-Type': 'text', //<- b/c Angular understands text
                }),
              };
              this.http
                .post(
                  layerDesc.wfs.url,
                  serializedFeature.outerHTML
                    .replaceAll('<geometry>', '<wkb_geometry>')
                    .replaceAll('</geometry>', '</wkb_geometry>'),
                  httpOptions
                )
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
          reject(err.data);
        });
    });
  }

  /**
   * @ngdoc method
   * @function pullVectorSource
   * @memberof HsLaymanService
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} layerName Object containing {name, title, crs} of
   * layer to retrieve
   * @returns {Promise<boolean>} Promise which WFS xml (GML3.1) response
   * with features for a specified layer
   * @description Retrieve layers features from server
   */
  pullVectorSource(endpoint, layerName) {
    return new Promise(async (resolve, reject) => {
      const descr: HsLaymanLayerDescriptor = await this.describeLayer(
        endpoint,
        layerName
      );
      if (descr === null) {
        resolve();
        return;
      }
      if (
        descr.wfs.status == 'NOT_AVAILABLE' &&
        descr.wms.status == 'NOT_AVAILABLE'
      ) {
        resolve();
        return;
      }
      if (descr.wfs.status == 'NOT_AVAILABLE') {
        setTimeout(() => {
          this.pullVectorSource(endpoint, layerName).then((response) =>
            resolve(response)
          );
        }, 2000);
        return;
      }
      try {
        /* When OL will support GML3.2, then we can use WFS
                        version 2.0.0. Currently only 3.1.1 is possible */
        const response = await this.http
          .get(
            descr.wfs.url +
              '?' +
              this.HsUtilsService.paramsToURL({
                service: 'wfs',
                version: '1.1.0',
                request: 'GetFeature',
                typeNames: `${endpoint.user}:${descr.name}`,
                r: Math.random(),
              })
          )
          .toPromise();
        resolve(response);
      } catch (ex) {
        resolve(null);
      }
    });
  }

  /**
   * @ngdoc method
   * @function describeLayer
   * @memberof HsLaymanService
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} layerName Layer name
   * @returns {Promise<boolean>} Promise which returns layers
   * description containig name, file, wms, wfs urls etc.
   * @description Try getting layer description from layman.
   */
  describeLayer(endpoint, layerName) {
    return new Promise(async (resolve, reject) => {
      try {
        const response: any = await this.http
          .get(
            `${endpoint.url}/rest/${
              endpoint.user
            }/layers/${layerName}?${Math.random()}`
          )
          .toPromise();
        if (response.data.code != undefined && response.data.code == 15) {
          resolve(null);
        }
        if (response.data.name) {
          resolve(response.data);
        }
      } catch (ex) {
        resolve(null);
      }
    });
  }

  /**
   * @ngdoc method
   * @function checkIfLayerExists
   * @memberof HsLaymanService
   * @public
   * @param {object} endpoint Endpoint description
   * @param {string} layerName Name of layer
   * @param {object} layerDesc Previously loaded layer descriptor
   * @returns {Promise<boolean>} Promise which returns boolean if layer
   * exists in Layman
   * @description Try getting layer description from layman. If it
   * succeeds, that means that layer is there and can be updated
   * instead of posting a new one
   */
  checkIfLayerExists(
    endpoint,
    layerName,
    layerDesc
  ): Promise<HsLaymanLayerDescriptor> {
    return new Promise((resolve, reject) => {
      if (layerDesc == undefined) {
        this.describeLayer(endpoint, layerName).then(
          (description: HsLaymanLayerDescriptor) => {
            if (
              description !== null &&
              description.code != undefined &&
              description.code == 15
            ) {
              resolve({exists: false});
            } else if (description !== null && description.name != undefined) {
              resolve(Object.assign(description, {exists: true}));
            } else {
              resolve({exists: false});
            }
          }
        );
      } else {
        resolve(layerDesc);
      }
    });
  }
}
