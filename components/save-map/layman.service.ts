import {GeoJSON, WFS} from 'ol/format';
/**
 * @param HsUtilsService
 * @param $http
 * @param HsMapService
 * @param $timeout
 * @param $log
 * @param HsCommonEndpointsService
 */
export class HsLaymanService {
  constructor(
    HsUtilsService,
    $http,
    HsMapService,
    $timeout,
    $log,
    HsCommonEndpointsService
  ) {
    'ngInject';

    Object.assign(this, {
      HsUtilsService,
      $http,
      HsMapService,
      $timeout,
      $log,
      HsCommonEndpointsService,
    });
  }

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
    return new Promise((resolve, reject) => {
      const formdata = new FormData();
      formdata.append(
        'file',
        new Blob([angular.toJson(compositionJson)], {
          type: 'application/json',
        }),
        'blob.json'
      );
      formdata.append('name', compoData.title);
      formdata.append('title', compoData.title);
      formdata.append('abstract', compoData.abstract);
      this.$http({
        url: `${endpoint.url}/rest/${endpoint.user}/maps${
          saveAsNew
            ? `?${Math.random()}`
            : '/' + this.urlFriendly(compoData.title)
        }`,
        method: saveAsNew ? 'POST' : 'PATCH',
        data: formdata,
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined},
      }).then(
        (response) => {
          resolve(response);
        },
        (err) => {
          reject(err.data);
        }
      );
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
  pushVectorSource(endpoint, geojson, description, layerDesc) {
    return new Promise((resolve, reject) => {
      const formdata = new FormData();
      formdata.append(
        'file',
        new Blob([angular.toJson(geojson)], {type: 'application/geo+json'}),
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
      this.checkIfLayerExists(endpoint, description.name, layerDesc)
        .then((layerDesc) => {
          this.$http({
            url: `${endpoint.url}/rest/${endpoint.user}/layers${
              layerDesc.exists ? '/' + description.name : ''
            }?${Math.random()}`,
            method: layerDesc.exists ? 'PATCH' : 'POST',
            data: formdata,
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined},
          }).then((response) => {
            resolve(response);
          });
        })
        .catch((err) => {
          reject(err.data);
        });
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
          this.$timeout(() => {
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
        .then((layerDesc) => {
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

              this.$http({
                url: layerDesc.wfs.url,
                method: 'POST',
                data: serializedFeature.outerHTML
                  .replaceAll('<geometry>', '<wkb_geometry>')
                  .replaceAll('</geometry>', '</wkb_geometry>'),
                headers: {'Content-Type': 'application/xml'},
              }).then((response) => {
                resolve(response);
              });
            } catch (ex) {
              this.$log.error(ex);
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
    return new Promise((resolve, reject) => {
      this.describeLayer(endpoint, layerName).then((descr) => {
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
          this.$timeout(() => {
            this.pullVectorSource(endpoint, layerName).then((response) =>
              resolve(response)
            );
          }, 2000);
          return;
        }
        /* When OL will support GML3.2, then we can use WFS
                        version 2.0.0. Currently only 3.1.1 is possible */
        this.$http({
          url:
            descr.wfs.url +
            '?' +
            this.HsUtilsService.paramsToURL({
              service: 'wfs',
              version: '1.1.0',
              request: 'GetFeature',
              typeNames: `${endpoint.user}:${descr.name}`,
              r: Math.random(),
            }),
          method: 'GET',
        }).then(
          (response) => {
            resolve(response);
          },
          (err) => resolve(null)
        );
      });
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
    return new Promise((resolve, reject) => {
      this.$http({
        url: `${endpoint.url}/rest/${
          endpoint.user
        }/layers/${layerName}?${Math.random()}`,
        method: 'GET',
      }).then(
        (response) => {
          if (
            angular.isDefined(response.data.code) &&
            response.data.code == 15
          ) {
            resolve(null);
          }
          if (angular.isDefined(response.data.name)) {
            resolve(response.data);
          }
        },
        (err) => {
          resolve(null);
        }
      );
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
  checkIfLayerExists(endpoint, layerName, layerDesc) {
    return new Promise((resolve, reject) => {
      if (angular.isUndefined(layerDesc)) {
        this.describeLayer(endpoint, layerName).then((description) => {
          if (
            description !== null &&
            angular.isDefined(description.code) &&
            description.code == 15
          ) {
            resolve({exists: false});
          } else if (
            description !== null &&
            angular.isDefined(description.name)
          ) {
            resolve(angular.extend(description, {exists: true}));
          } else {
            resolve({exists: false});
          }
        });
      } else {
        resolve(layerDesc);
      }
    });
  }
}
