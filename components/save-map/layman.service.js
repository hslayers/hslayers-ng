import { GeoJSON, WFS } from 'ol/format';
export default ['Core', 'hs.utils.service', '$http', 'config', 'hs.map.service',
    function (Core, utils, $http, config, hsMap) {
        var me = this;
        angular.extend(me, {
            /**
            * @ngdoc method
            * @function save 
            * @memberof hs.laymanService
            * @public
            * @param {Object} endpoint 
            * @param {String} compositionJson Json with composition definition
            * @param {String} compoData Additional fields for composition such 
            * as title, name
            * @returns {Promise<Boolean>} Promise result of POST 
            * @description Save composition to Layman
            */
            save(compositionJson, endpoint, compoData) {
                return new Promise((resolve, reject) => {
                    var formdata = new FormData();
                    formdata.append('file',
                        new Blob([JSON.stringify(compositionJson)],
                            { type: 'application/json' }), 'blob.json'
                    );
                    formdata.append('name', compoData.title);
                    formdata.append('title', compoData.title);
                    formdata.append('abstract', compoData.abstract);
                    $http({
                        url: `${endpoint.url}/rest/${endpoint.user}/maps?${Math.random()}`,
                        method: 'POST',
                        data: formdata,
                        transformRequest: angular.identity,
                        headers: { 'Content-Type': undefined }
                    })
                        .then(function (response) {
                            resolve(response)
                        }, function (err) {
                            reject(err.data)
                        });
                })
            },

            /**
            * @ngdoc method
            * @function pushVectorSource 
            * @memberof hs.laymanService
            * @public
            * @param {Object} endpoint 
            * @param {String} geojson Geojson object with features to send to server 
            * @param {String} description Object containing {name, title, crs} of 
            * layer to retrieve
            * @param {Object} layerDesc Previously fetched layer descriptor
            * @returns {Promise<Boolean>} Promise result of POST/PATCH 
            * @description Send layer definition and features to Layman
            */
            pushVectorSource(endpoint, geojson, description, layerDesc) {
                return new Promise((resolve, reject) => {
                    var formdata = new FormData();
                    formdata.append('file',
                        new Blob([JSON.stringify(geojson)],
                            { type: 'application/geo+json' }), 'blob.geojson'
                    );
                    formdata.append('sld',
                        new Blob([],
                            { type: 'application/octet-stream' }), ''
                    );
                    formdata.append('name', description.name);
                    formdata.append('title', description.title);
                    formdata.append('crs', description.crs);
                    me.checkIfLayerExists(endpoint, description.name, layerDesc)
                        .then(layerDesc => {
                            $http({
                                url: `${endpoint.url}/rest/${endpoint.user}/layers${layerDesc.exists ? '/' + description.name : ''}?${Math.random()}`,
                                method: layerDesc.exists ? 'PATCH' : 'POST',
                                data: formdata,
                                transformRequest: angular.identity,
                                headers: { 'Content-Type': undefined }
                            }).then(function (response) {
                                resolve(response)
                            })
                        })
                        .catch(err => {
                            reject(err.data)
                        });
                })
            },

            /**
             * Send all features to Layman endpoint as WFS string
             * @memberof hs.layerSynchronizerService
             * @function getLayerName
             * @param {Ol.layer} layer Layer to get Layman friendly name for
             * get features
             */
            push(layer) {
                if (layer.getSource().loading) return;
                var f = new GeoJSON();
                var geojson = f.writeFeaturesObject(layer.getSource().getFeatures());
                (config.datasources || []).filter(ds => ds.type == 'layman').forEach(
                    ds => {
                        layer.set('hs-layman-synchronizing', true);
                        me.pushVectorSource(ds, geojson, {
                            title: layer.get('title'),
                            name: me.getLayerName(layer),
                            crs: me.crs
                        }).then(response => {
                            setTimeout(function(){
                                me.pullVectorSource(ds, me.getLayerName(layer))
                                .then(response => {
                                    layer.set('hs-layman-synchronizing', false);
                                })
                            }, 2000);
                        });
                    })
            },

            /**
           * @ngdoc method
           * @function addFeature 
           * @memberof hs.laymanService
           * @public
           * @param {Object} endpoint 
           * @param {Array} featuresToAdd Array of features to add
           * @param {Array} featuresToUpd Array of features to update
           * @param {Array} featuresToDel Array of features to delete
           * @returns {Promise<Boolean>} Promise result of POST
           * @description Insert a feature 
           */
            createWfsTransaction(endpoint, featuresToAdd, featuresToUpd, featuresToDel, name, layer) {
                return new Promise((resolve, reject) => {
                    me.checkIfLayerExists(endpoint, name, layer.get('laymanLayerDescriptor'))
                        .then((layerDesc) => {
                            if(layerDesc.exists){
                                layer.set('laymanLayerDescriptor', layerDesc);
                                try {
                                    const wfsFormat = new WFS();
                                    const serializedFeature = wfsFormat.writeTransaction(featuresToAdd, featuresToUpd, featuresToDel, {
                                        featureNS: 'http://' + endpoint.user,
                                        featurePrefix: endpoint.user,
                                        featureType: name,
                                        srsName: hsMap.map.getView().getProjection().getCode()
                                    });
    
                                    $http({
                                        url: layerDesc.wfs.url,
                                        method: 'POST',
                                        data: serializedFeature.outerHTML.replaceAll('<geometry>', '<wkb_geometry>').replaceAll('</geometry>', '</wkb_geometry>'),
                                        headers: { "Content-Type": 'application/xml' }
                                    }).then(function (response) {
                                        resolve(response)
                                    })
                                } catch (ex) {
                                    console.error(ex)
                                }
                            } else {
                                me.push(layer);
                            }
                        })
                        .catch(err => {
                            reject(err.data)
                        });
                })
            },

            /**
            * @ngdoc method
            * @function pullVectorSource 
            * @memberof hs.laymanService
            * @public
            * @param {Object} endpoint 
            * @param {String} layerName Object containing {name, title, crs} of 
            * layer to retrieve
            * @returns {Promise<Boolean>} Promise which WFS xml (GML3.1) response 
            * with features for a specified layer
            * @description Retrieve layers features from server
            */
            pullVectorSource(endpoint, layerName) {
                return new Promise((resolve, reject) => {
                    me.describeLayer(endpoint, layerName).then(descr => {
                        if (descr == null) {
                            resolve();
                            return;
                        }
                        if (descr.wfs.status == 'NOT_AVAILABLE' && descr.wms.status == 'NOT_AVAILABLE') {
                            resolve();
                            return;
                        }
                        if (descr.wfs.status == 'NOT_AVAILABLE') {
                            setTimeout(function () {
                                me.pullVectorSource(endpoint, layerName).then(response => resolve(response))
                            }, 2000);
                            return;
                        }
                        /* When OL will support GML3.2, then we can use WFS 
                        version 2.0.0. Currently only 3.1.1 is possible */
                        $http({
                            url: descr.wfs.url + '?' + utils.paramsToURL({
                                service: 'wfs',
                                version: '1.1.0',
                                request: 'GetFeature',
                                typeNames: `${endpoint.user}:${descr.name}`,
                                r: Math.random()
                            }),
                            method: 'GET'
                        })
                            .then(function (response) {
                                resolve(response);
                            }, err => resolve(null))
                    })
                })
            },

            /**
            * @ngdoc method
            * @function describeLayer 
            * @memberof hs.laymanService
            * @public
            * @param {Object} endpoint 
            * @param {String} layerName 
            * @returns {Promise<Boolean>} Promise which returns layers 
            * description containig name, file, wms, wfs urls etc.
            * @description Try getting layer description from layman.
            */
            describeLayer(endpoint, layerName) {
                return new Promise((resolve, reject) => {
                    $http({
                        url: `${endpoint.url}/rest/${endpoint.user}/layers/${layerName}?${Math.random()}`,
                        method: 'GET'
                    })
                        .then(function (response) {
                            if (angular.isDefined(response.data.code) &&
                                response.data.code == 15)
                                resolve(null);
                            if (angular.isDefined(response.data.name))
                                resolve(response.data);
                        }, err => {
                            resolve(null)
                        })
                })
            },

            /**
            * @ngdoc method
            * @function checkIfLayerExists 
            * @memberof hs.laymanService
            * @public
            * @param {Object} endpoint 
            * @param {String} layerName 
            * @param {Object} layerDesc Previously loaded layer descriptor
            * @returns {Promise<Boolean>} Promise which returns boolean if layer 
            * exists in Layman
            * @description Try getting layer description from layman. If it 
            * succeeds, that means that layer is there and can be updated 
            * instead of postign a new one
            */
            checkIfLayerExists(endpoint, layerName, layerDesc) {
                return new Promise((resolve, reject) => {
                    if (angular.isUndefined(layerDesc)) {
                        me.describeLayer(endpoint, layerName)
                            .then(description => {
                                if (description != null &&
                                    angular.isDefined(description.code) &&
                                    description.code == 15)
                                    resolve({ exists: false });
                                else if (description != null &&
                                    angular.isDefined(description.name))
                                    resolve(angular.extend(description, { exists: true }));
                                else
                                    resolve({ exists: false })
                            })
                    } else {
                        resolve(layerDesc)
                    }
                })
            }

        });
        return me;
    }]