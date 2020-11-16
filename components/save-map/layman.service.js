import * as unidecode from 'unidecode';
import {GeoJSON, WFS} from 'ol/format';
import {Vector as VectorSource} from 'ol/source';

/**
 * @param HsUtilsService
 * @param $http
 * @param HsMapService
 * @param $timeout
 * @param $log
 * @param HsCommonEndpointsService
 */
export default function (
  HsUtilsService,
  $http,
  HsMapService,
  $timeout,
  $log,
  HsCommonEndpointsService
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
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
        $http({
          url: `${endpoint.url}/rest/${endpoint.user}/maps${
            saveAsNew
              ? `?${Math.random()}`
              : '/' + me.urlFriendly(compoData.title)
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
    },

    urlFriendly(text) {
      return text.replaceAll(' ', '').toLowerCase();
    },

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
        me.checkIfLayerExists(endpoint, description.name, layerDesc)
          .then((layerDesc) => {
            $http({
              url: `${endpoint.url}/rest/${endpoint.user}/layers${
                layerDesc && layerDesc.name ? '/' + description.name : ''
              }?${Math.random()}`,
              method: layerDesc && layerDesc.name ? 'PATCH' : 'POST',
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
    },
    /**
     * Get layman friendly name of layer based primary on name
     * and secondary on title attributes.
     *
     * @param layer Layr to get the name for
     */

    getLayerName(layer) {
      const layerName = layer.get('name') || layer.get('title');
      if (layerName == undefined) {
        console.warn('Layer title/name not set for', layer);
      }
      return me.getLaymanFriendlyLayerName(layerName);
    },
    /**
     * @description Get Layman friendly name for layer based on its title by
     * replacing spaces with underscores, converting to lowercase, etc.
     * see https://github.com/jirik/layman/blob/c79edab5d9be51dee0e2bfc5b2f6a380d2657cbd/src/layman/util.py#L30
     * @param title
     * @function getLaymanFriendlyLayerName
     * @param {string} layerName Name to get Layman-friendly name for
     * @returns {string} New layer title
     */
    getLaymanFriendlyLayerName(title) {
      return unidecode(title)
        .toLowerCase()
        .replace(/[^\w\s\-\.]/gm, '')
        .trim()
        .replace(/[\s\-\._]+/gm, '_');
    },

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
      const layerName = me.getLayerName(layer);
      let layerTitle = layer.get('title');
      const f = new GeoJSON();
      const geojson = f.writeFeaturesObject(layer.getSource().getFeatures());
      (HsCommonEndpointsService.endpoints || [])
        .filter((ds) => ds.type == 'layman')
        .forEach((ds) => {
          if (ds.version !== undefined && ds.version.split('.').join() < 171) {
            layerTitle = this.getLaymanFriendlyLayerName(layerTitle);
          }
          layer.set('hs-layman-synchronizing', true);
          me.pushVectorSource(ds, geojson, {
            title: layerTitle,
            name: layerName,
            crs: me.crs,
          }).then((response) => {
            $timeout(() => {
              me.pullVectorSource(ds, layerName, layer).then((response) => {
                layer.set('hs-layman-synchronizing', false);
              });
            }, 2000);
          });
        });
    },

    /**
     * @ngdoc method
     * @function addFeature
     * @memberof HsLaymanService
     * @public
     * @param {object} endpoint Endpoint description
     * @param _endpoint
     * @param {Array} featuresToAdd Array of features to add
     * @param {Array} featuresToUpd Array of features to update
     * @param {Array} featuresToDel Array of features to delete
     * @param {string} name Name of layer
     * @param {ol/Layer} layer Openlayers layer
     * @returns {Promise<boolean>} Promise result of POST
     * @description Insert a feature
     */
    createWfsTransaction(
      _endpoint,
      featuresToAdd,
      featuresToUpd,
      featuresToDel,
      name,
      layer
    ) {
      /* Clone because endpoint.user can change while the request is processed
    and then description might get cached even if anonymous user was set before.
    Should not cache anonymous layers, because layer can be authorized any moment */
      const endpoint = {..._endpoint};
      return new Promise((resolve, reject) => {
        me.checkIfLayerExists(
          endpoint,
          name,
          layer.get('laymanLayerDescriptor')
        )
          .then((layerDesc) => {
            if (layerDesc && layerDesc.name) {
              this.cacheLaymanDescriptor(layer, layerDesc, endpoint);
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
                    srsName: HsMapService.map
                      .getView()
                      .getProjection()
                      .getCode(),
                  }
                );

                $http({
                  url: layerDesc.wfs.url + '?request=Transaction',
                  method: 'POST',
                  data: serializedFeature.outerHTML
                    .replaceAll('<geometry>', '<wkb_geometry>')
                    .replaceAll('</geometry>', '</wkb_geometry>'),
                  headers: {'Content-Type': 'application/xml'},
                }).then((response) => {
                  resolve(response);
                });
              } catch (ex) {
                $log.error(ex);
              }
            } else {
              me.push(layer);
            }
          })
          .catch((err) => {
            reject(err.data);
          });
      });
    },

    cacheLaymanDescriptor(layer, desc, endpoint) {
      if (endpoint.user != 'browser') {
        layer.set('laymanLayerDescriptor', desc);
      }
    },
    /**
     * @ngdoc method
     * @function pullVectorSource
     * @param _endpoint
     * @param layer
     * @memberof HsLaymanService
     * @public
     * @param {object} endpoint Endpoint description
     * @param {string} layerName Object containing {name, title, crs} of
     * layer to retrieve
     * @returns {Promise<boolean>} Promise which WFS xml (GML3.1) response
     * with features for a specified layer
     * @description Retrieve layers features from server
     */
    pullVectorSource(_endpoint, layerName, layer) {
      /* Clone because endpoint.user can change while the request is processed
    and then description might get cached even if anonymous user was set before.
    Should not cache anonymous layers, because layer can be authorized any moment */
      const endpoint = {..._endpoint};
      return new Promise((resolve, reject) => {
        me.describeLayer(endpoint, layerName).then((descr) => {
          if (descr === null) {
            resolve();
            return;
          }
          if (descr && descr.name) {
            this.cacheLaymanDescriptor(layer, descr, endpoint);
          }
          if (
            descr.wfs.status == 'NOT_AVAILABLE' &&
            descr.wms.status == 'NOT_AVAILABLE'
          ) {
            resolve();
            return;
          }
          if (descr.wfs.status == 'NOT_AVAILABLE') {
            $timeout(() => {
              me.pullVectorSource(endpoint, layerName, layer).then((response) =>
                resolve(response)
              );
            }, 2000);
            return;
          }
          /* When OL will support GML3.2, then we can use WFS
                        version 2.0.0. Currently only 3.1.1 is possible */
          $http({
            url:
              descr.wfs.url +
              '?' +
              HsUtilsService.paramsToURL({
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
    },

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
        $http({
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
    },

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
          me.describeLayer(endpoint, layerName).then((description) => {
            if (
              description !== null &&
              angular.isDefined(description.code) &&
              description.code == 15
            ) {
              resolve();
            } else if (
              description !== null &&
              angular.isDefined(description.name)
            ) {
              resolve(description);
            } else {
              resolve();
            }
          });
        } else {
          resolve(layerDesc);
        }
      });
    },

    /**
     * @function laymanEndpointExists
     * @param layer
     * @public
     * @description Checks whether the layman endpoint exists or not
     */
    getLaymanEndpoint() {
      return HsCommonEndpointsService.endpoints.filter((e)=> e.type == 'layman').pop().url;
    },
    /**
     * @function removeLayer
     * @param layer
     * @public
     * @description Removes selected layer from layman.
     */
    removeLayer(layer) {
      (HsCommonEndpointsService.endpoints || [])
        .filter((ds) => ds.type == 'layman')
        .forEach((ds) => {
          $http.delete(
            `${ds.url}/rest/${ds.user}/layers/${me.getLayerName(layer)}`
          );
        });
    },

    isLayerSynchronizable(layer) {
      const definition = layer.get('definition');
      if (!definition) {
        return false;
      }
      return (
        HsUtilsService.instOf(layer.getSource(), VectorSource) &&
        definition.format.toLowerCase().includes('wfs')
      );
    },
  });
  return me;
}
