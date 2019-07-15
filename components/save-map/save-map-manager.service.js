import { transform } from 'ol/proj';

export default ['$rootScope', 'hs.map.service', 'Core', 'hs.save-map.service', 'config', '$http',
    function ($rootScope, OlMap, Core, saveMap, config, $http) {
        var me = {}
        me.compoData = {
            title: "",
            abstract: "",
            keywords: [],
            layers: [],
            id: "",
            thumbnail: undefined,
            bbox: undefined,
            currentCompositionTitle: "",
            currentComposition: undefined
        };
        me.userData = {
            email: "",
            phone: "",
            name: "",
            address: "",
            country: "",
            postalCode: "",
            city: "",
            organization: "",
        };
        me.statusData = {
            titleFree: undefined,
            hasPermission: undefined,
            success: undefined,
            changeTitle: undefined,
            groups: []
        };
        me.confirmSave = function () {
            $http({
                method: 'POST',
                url: saveMap.endpointUrl(),
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
        };
        me.save = function (saveAsNew) {
            if (saveAsNew || me.compoData.id == '') me.compoData.id = saveMap.generateUuid();
            $http({
                url: saveMap.endpointUrl(),
                method: 'POST',
                data: JSON.stringify({
                    data: saveMap.map2json(OlMap.map, me.compoData, me.userData, me.statusData),
                    permanent: true,
                    id: me.compoData.id,
                    project: config.project_name,
                    thumbnail: me.compoData.thumbnail,
                    request: "save"
                })
            }).then(function (response) {
                var compInfo = {};
                var j = response.data;
                compInfo.id = me.compoData.id;
                compInfo.title = me.compoData.title;
                compInfo.abstract = me.compoData.abstract || '';
                me.status = angular.isDefined(j.saved) && (j.saved !== false);
                $rootScope.$broadcast('compositions.composition_loading', compInfo);
                $rootScope.$broadcast('compositions.composition_loaded', compInfo);
                $rootScope.$broadcast('StatusManager.saveResult', 'saveResult', angular.isDefined(j.saved) && (j.saved !== false) ? 'ok' : 'not-saved');
            }, function (err) {
                me.statusData.success = false;
                $rootScope.$broadcast('StatusManager.saveResult', 'saveResult', 'error');
            });
        };
        /**
         * Initialization of Status Creator from outside of component
         * @function open
         * @memberof hs.save-map.controller
         */
        me.open = function () {
            Core.setMainPanel('saveMap', true);
            me.refresh();
        };
        me.refresh = function () {
            me.compoData.layers = [];
            me.compoData.bbox = me.getCurrentExtent();
            //debugger;
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
        }
        /**
         * Send getGroups request to status manager server and process response
         * @function fillGroups
         * @memberof hs.save-map.managerService
         */
        me.fillGroups = function (cb) {
            me.statusData.groups = [];
            if (config.advancedForm) {
                $http({
                    url: saveMap.endpointUrl(),
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
        };

        /**
         * Get User info from server and call callback (setUserDetail)
         * @function loadUserDetails
         * @memberof hs.save-map.managerService
         */
        me.loadUserDetails = function () {
            //TODO: This long statement should be in function
            $http({ url: saveMap.endpointUrl() + "?request=getuserinfo" }).
                then(me.setUserDetails, function (err) { });
        };

        /**
         * Process user info into controller model, so they can be used in Save composition forms
         * @function setUserDetails
         * @memberof hs.save-map.managerService
         * @param {Object} response Http response containig user data
         */
        me.setUserDetails = function (response) {
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
        };


        /**
         * Get current extent of map, transform it into EPSG:4326 and save it into controller model
         * @function getCurrentExtent
         * @memberof hs.save-map.managerService
         */
        me.getCurrentExtent = function () {
            var b = OlMap.map.getView().calculateExtent(OlMap.map.getSize());
            var pair1 = [b[0], b[1]]
            var pair2 = [b[2], b[3]];
            var cur_proj = OlMap.map.getView().getProjection().getCode();
            pair1 = transform(pair1, cur_proj, 'EPSG:4326');
            pair2 = transform(pair2, cur_proj, 'EPSG:4326');
            return [pair1[0].toFixed(2), pair1[1].toFixed(2), pair2[0].toFixed(2), pair2[1].toFixed(2)];
        }

        $rootScope.$on('StatusCreator.open', function (e) {
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

        me.resetCompoData = function () {
            me.compoData.id = me.compoData.abstract = me.compoData.title = me.compoData.currentCompositionTitle = me.compoData.keywords = me.compoData.currentComposition = '';
        }

        $rootScope.$on('core.map_reset', function (event, data) {
            me.resetCompoData();
        });

        $rootScope.$on('core.mainpanel_changed', function (event) {
            if (Core.mainpanel == 'saveMap' || Core.mainpanel == 'statusCreator') {
                me.refresh();
                saveMap.generateThumbnail(document.getElementById('hs-stc-thumbnail'), me.compoData);
            }
        });

        $rootScope.$on('map.extent_changed', function (event) {
            me.compoData.bbox = me.getCurrentExtent();
            saveMap.generateThumbnail(document.getElementById('hs-stc-thumbnail'), me.compoData);
        });

        return me;
    }]