import { transform } from 'ol/proj';

export default ['$rootScope', 'hs.map.service', 'Core', 'hs.save-map.service',
    'config', '$http', 'hs.statusManagerService', 'hs.laymanService', 'hs.layout.service', 'hs.utils.service',
    function ($rootScope, OlMap, Core, saveMap, config, $http, statusManagerService, laymanService, layoutService, utils) {
        var me = this;
        angular.extend(me, {
            btnSelectDeseletClicked: true,
            compoData: {
                title: "",
                abstract: "",
                keywords: [],
                layers: [],
                id: "",
                thumbnail: undefined,
                bbox: undefined,
                currentCompositionTitle: "",
                currentComposition: undefined
            },
            userData: {
                email: "",
                phone: "",
                name: "",
                address: "",
                country: "",
                postalCode: "",
                city: "",
                organization: "",
            },
            statusData: {
                titleFree: undefined,
                hasPermission: undefined,
                success: undefined,
                changeTitle: undefined,
                groups: []
            },
            /**
 * Select or deselect all layers
 * @function selectDeselectAllLayers
 * @memberof hs.save-map
 */
            selectDeselectAllLayers() {
                me.btnSelectDeseletClicked = !me.btnSelectDeseletClicked;
                me.compoData.layers.forEach(layer => layer.checked = me.btnSelectDeseletClicked);
            },
            confirmSave() {
                $http({
                    method: 'POST',
                    url: statusManagerService.endpointUrl(),
                    data: JSON.stringify({
                        project: config.project_name,
                        title: me.compoData.title,
                        request: 'rightToSave'
                    })
                }).
                    then(function (response) {
                        var j = response.data;
                        me.statusData.hasPermission = j.results.hasPermission;
                        me.statusData.titleFree = j.results.titleFree
                        if (j.results.guessedTitle) {
                            me.statusData.guessedTitle = j.results.guessedTitle;
                        }
                        if (!me.statusData.titleFree) me.statusData.changeTitle = false;
                        if (me.statusData.titleFree && me.statusData.hasPermission) {
                            me.save(true);
                        } else {
                            $rootScope.$broadcast('StatusManager.saveResult', 'saveConfirm');
                        }
                    }, function (err) {
                        me.statusData.success = false;
                        $rootScope.$broadcast('StatusManager.saveResult', 'saveResult', 'error');
                    });
            },

            save(saveAsNew, endpoint) {
                if (saveAsNew || me.compoData.id == '')
                    me.compoData.id = saveMap.generateUuid();
                var compositionJson = saveMap.map2json(OlMap.map, me.compoData, me.userData, me.statusData);
                var saver = statusManagerService;
                if (endpoint.type == 'layman')
                    saver = laymanService;
                saver.save(compositionJson, endpoint, me.compoData)
                    .then(response => {
                        var compInfo = {};
                        var j = response.data;
                        compInfo.id = me.compoData.id;
                        compInfo.title = me.compoData.title;
                        compInfo.abstract = me.compoData.abstract || '';
                        if (endpoint.type == 'statusmanager')
                            me.status = angular.isDefined(j.saved) && (j.saved !== false);
                        if (endpoint.type == 'layman')
                            me.status = j.length == 1 && angular.isDefined(j[0].uuid)
                        $rootScope.$broadcast('compositions.composition_loading', compInfo);
                        $rootScope.$broadcast('compositions.composition_loaded', compInfo);
                        const saveStatus = me.status ? 'ok' : 'not-saved';
                        me.statusData.success = me.status;
                        $rootScope.$broadcast('StatusManager.saveResult',
                            'saveResult', saveStatus);
                    }).catch(e => {
                        //e contains the json responses data object from api
                        me.statusData.success = false;
                        $rootScope.$broadcast('StatusManager.saveResult',
                            'saveResult', 'error', e);
                    })


            },

            /**
             * Initialization of Status Creator from outside of component
             * @function open
             * @memberof hs.save-map.controller
             */
            open() {
                layoutService.setMainPanel('saveMap', true);
                me.refresh();
            },

            refresh() {
                me.compoData.layers = [];
                me.compoData.bbox = me.getCurrentExtent();
                OlMap.map.getLayers().forEach(function (lyr) {
                    if ((angular.isUndefined(lyr.get('show_in_manager')) || lyr.get('show_in_manager') == true) && (lyr.get('base') != true)) {
                        me.compoData.layers.push({
                            title: lyr.get('title'),
                            checked: true,
                            layer: lyr
                        });
                    }
                });
                me.compoData.layers.sort(function (a, b) {
                    return a.layer.get('position') - b.layer.get('position')
                });
                me.fillGroups(function () {
                    me.statusData.groups.unshift({
                        roleTitle: 'Public',
                        roleName: 'guest',
                        w: false,
                        r: false
                    });
                    var cc = me.compoData.currentComposition;
                    if (angular.isDefined(me.compoData.currentComposition) && cc != "") {
                        angular.forEach(me.statusData.groups, function (g) {
                            if (angular.isDefined(cc.groups) && angular.isDefined(cc.groups[g.roleName])) {
                                g.w = cc.groups[g.roleName].indexOf('w') > -1;
                                g.r = cc.groups[g.roleName].indexOf('r') > -1;
                            }
                        });
                    }
                });
                me.loadUserDetails();
            },

            /**
            * Send getGroups request to status manager server and process response
            * @function fillGroups
            * @memberof hs.saveMapManagerService
            */
            fillGroups(cb) {
                me.statusData.groups = [];
                if (config.advancedForm) {
                    $http({
                        url: statusManagerService.endpointUrl(),
                        method: 'GET',
                        data: {
                            request: 'getGroups'
                        }
                    }).
                        then(function (response) {
                            var j = response.data;
                            if (j.success) {
                                me.statusData.groups = j.result;
                                angular.forEach(me.statusData.groups, function (g) {
                                    g.w = false;
                                    g.r = false;
                                });
                            }
                            cb();
                        }, function (err) {

                        });
                } else {
                    cb();
                }
            },

            /**
             * Get User info from server and call callback (setUserDetail)
             * @function loadUserDetails
             * @memberof hs.saveMapManagerService
             */
            loadUserDetails() {
                $http({ url: statusManagerService.endpointUrl() + "?request=getuserinfo" }).
                    then(me.setUserDetails, function (err) { });
            },

            /**
             * Process user info into controller model, so they can be used in Save composition forms
             * @function setUserDetails
             * @memberof hs.saveMapManagerService
             * @param {Object} response Http response containig user data
             */
            setUserDetails(response) {
                var user = response.data;
                if (user && user.success == true) {
                    // set the values
                    if (user.userInfo) {
                        me.userData.email = user.userInfo.email;
                        me.userData.phone = user.userInfo.phone;
                        me.userData.name = user.userInfo.firstName + " " + user.userInfo.lastName;
                    }
                    if (user.userInfo && user.userInfo.org) {
                        me.userData.address = user.userInfo.org.street;
                        me.userData.country = user.userInfo.org.state;
                        me.userData.postalcode = user.userInfo.org.zip;
                        me.userData.city = user.userInfo.org.city;
                        me.userData.organization = user.userInfo.org.name;
                    }
                }
            },

            /**
             * Get current extent of map, transform it into EPSG:4326 and save it into controller model
             * @function getCurrentExtent
             * @memberof hs.saveMapManagerService
             */
            getCurrentExtent() {
                var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
                var pair1 = [b[0], b[1]]
                var pair2 = [b[2], b[3]];
                var cur_proj = OlMap.map.getView().getProjection().getCode();
                pair1 = transform(pair1, cur_proj, 'EPSG:4326');
                pair2 = transform(pair2, cur_proj, 'EPSG:4326');
                return [pair1[0].toFixed(2), pair1[1].toFixed(2), pair2[0].toFixed(2), pair2[1].toFixed(2)];
            },
            resetCompoData() {
                me.compoData.id = me.compoData.abstract = me.compoData.title = me.compoData.currentCompositionTitle = me.compoData.keywords = me.compoData.currentComposition = '';
            }
        })

        me.endpoints = [
            {
                type: 'statusmanager',
                name: 'Status manager',
                url: status
            }
        ];

        (config.datasources || []).filter(ds => ds.type == 'layman').forEach(
            ds => {
                me.endpoints.push({
                    type: 'layman',
                    name: 'Layman',
                    url: ds.url,
                    user: ds.user
                })
            })

        $rootScope.$on('StatusCreator.open', function (e, composition) {
            me.open();
        });

        $rootScope.$on('compositions.composition_loaded', function (event, data) {
            if (angular.isUndefined(data.error)) {
                if (data.data) {
                    me.compoData.id = data.id;
                    me.compoData.abstract = data.data.abstract;
                    me.compoData.title = data.data.title;
                    me.compoData.keywords = data.data.keywords;
                    me.compoData.currentComposition = data.data;
                } else {
                    me.compoData.id = data.id;
                    me.compoData.abstract = data.abstract;
                    me.compoData.title = data.title;
                    me.compoData.keywords = data.keywords;
                    me.compoData.currentComposition = data;
                }

                me.compoData.currentCompositionTitle = me.compoData.title;
            }
        });

        $rootScope.$on('core.map_reset', function (event, data) {
            me.resetCompoData();
        });

        $rootScope.$on('core.mainpanel_changed', function (event) {
            if (layoutService.mainpanel == 'saveMap' || layoutService.mainpanel == 'statusCreator') {
                me.refresh();
                saveMap.generateThumbnail(document.getElementById('hs-stc-thumbnail'), me.compoData);
            }
        });

        OlMap.map.on('postcompose', utils.debounce(() => {
            me.compoData.bbox = me.getCurrentExtent();
            saveMap.generateThumbnail(document.getElementById('hs-stc-thumbnail'), me.compoData);
        }, 300));

        return me;
    }]