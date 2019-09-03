export default ['Core', 'hs.utils.service', '$http', 'config',
    function (Core, utils, $http, config) {
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
            * @param {Boolean} exists Set to true if you are sure that layer 
            * exists (has been checked before and result stored somewhere)
            * @returns {Promise<Boolean>} Promise result of POST/PATCH 
            * @description Send layer definition and features to Layman
            */
            pushVectorSource(endpoint, geojson, description, exists) {
                return new Promise((resolve, reject) => {
                    var formdata = new FormData();
                    formdata.append('file',
                        new Blob([JSON.stringify(geojson)],
                            { type: 'application/geo+json' }), 'blob.geojson'
                    );
                    formdata.append('name', description.name);
                    formdata.append('title', description.title);
                    formdata.append('crs', description.crs);
                    me.checkIfLayerExists(endpoint, description.name, exists)
                        .then(exists => {
                            $http({
                                url: `${endpoint.url}/rest/${endpoint.user}/layers${exists ? '/' + description.name : ''}?${Math.random()}`,
                                method: exists ? 'PATCH' : 'POST',
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
                        if(descr.wfs.status == 'NOT_AVAILABLE'){
                            setTimeout(function(){
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
            * @param {Boolean} exists Set to true if you are sure that layer 
            * exists (has been checked before and result stored somewhere)
            * @returns {Promise<Boolean>} Promise which returns boolean if layer 
            * exists in Layman
            * @description Try getting layer description from layman. If it 
            * succeeds, that means that layer is there and can be updated 
            * instead of postign a new one
            */
            checkIfLayerExists(endpoint, layerName, exists) {
                return new Promise((resolve, reject) => {
                    if (angular.isUndefined(exists)) {
                        me.describeLayer(endpoint, layerName)
                            .then(description => {
                                if (description != null &&
                                    angular.isDefined(description.code) &&
                                    description.code == 15)
                                    resolve(false);
                                else if (description != null && 
                                    angular.isDefined(description.name))
                                    resolve(true);
                                else
                                    resolve(false)
                            })
                    } else {
                        resolve(exists)
                    }
                })
            }

        });
        return me;
    }]