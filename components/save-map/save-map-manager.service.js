/* eslint-disable angular/on-watch */
import {transform} from 'ol/proj';

/**
 * @param $rootScope
 * @param HsMapService
 * @param HsSaveMapService
 * @param HsConfig
 * @param $http
 * @param HsStatusManagerService
 * @param HsLaymanService
 * @param HsLayoutService
 * @param HsUtilsService
 * @param HsEventBusService
 */
export default function (
  $rootScope,
  HsMapService,
  HsSaveMapService,
  HsConfig,
  $http,
  HsStatusManagerService,
  HsLaymanService,
  HsLayoutService,
  HsUtilsService,
  HsEventBusService
) {
  'ngInject';
  const me = this;
  angular.extend(me, {
    btnSelectDeseletClicked: true,
    compoData: {
      title: '',
      abstract: '',
      keywords: [],
      layers: [],
      id: '',
      thumbnail: undefined,
      bbox: undefined,
      currentCompositionTitle: '',
      currentComposition: undefined,
    },
    userData: {
      email: '',
      phone: '',
      name: '',
      address: '',
      country: '',
      postalCode: '',
      city: '',
      organization: '',
    },
    statusData: {
      titleFree: undefined,
      hasPermission: undefined,
      success: undefined,
      changeTitle: undefined,
      groups: [],
    },

    /**
     * Select or deselect all layers
     *
     * @function selectDeselectAllLayers
     * @memberof hs.save-map
     */
    selectDeselectAllLayers() {
      me.btnSelectDeseletClicked = !me.btnSelectDeseletClicked;
      me.compoData.layers.forEach(
        (layer) => (layer.checked = me.btnSelectDeseletClicked)
      );
    },

    confirmSave() {
      $http({
        method: 'POST',
        url: HsStatusManagerService.endpointUrl(),
        data: angular.toJson({
          project: HsConfig.project_name,
          title: me.compoData.title,
          request: 'rightToSave',
        }),
      }).then(
        (response) => {
          const j = response.data;
          me.statusData.hasPermission = j.results.hasPermission;
          me.statusData.titleFree = j.results.titleFree;
          if (j.results.guessedTitle) {
            me.statusData.guessedTitle = j.results.guessedTitle;
          }
          if (!me.statusData.titleFree) {
            me.statusData.changeTitle = false;
          }
          if (me.statusData.titleFree && me.statusData.hasPermission) {
            me.save(true);
          } else {
            $rootScope.$broadcast('StatusManager.saveResult', 'saveConfirm');
          }
        },
        (err) => {
          me.statusData.success = false;
          $rootScope.$broadcast(
            'StatusManager.saveResult',
            'saveResult',
            'error'
          );
        }
      );
    },

    save(saveAsNew, endpoint) {
      return new Promise((resolve, reject) => {
        const compositionJson = HsSaveMapService.map2json(
          HsMapService.map,
          me.compoData,
          me.userData,
          me.statusData
        );
        let saver = HsStatusManagerService;
        if (endpoint.type == 'layman') {
          saver = HsLaymanService;
        }
        saver
          .save(compositionJson, endpoint, me.compoData, saveAsNew)
          .then((response) => {
            const compInfo = {};
            const j = response.data;
            let status = false;
            if (endpoint.type == 'statusmanager') {
              status = angular.isDefined(j.saved) && j.saved !== false;
            }
            if (endpoint.type == 'layman') {
              if (saveAsNew) {
                status = j.length == 1 && angular.isDefined(j[0].uuid);
              } else {
                status = angular.isDefined(j.uuid);
              }
            }
            if (!status) {
              if (endpoint.type == 'layman' && j.status == 'CONFLICT') {
                compInfo.id = j[0].uuid;
                compInfo.name = j[0].name;
              }
              if (endpoint.type == 'statusmanager') {
                compInfo.id = j.id;
                compInfo.title = j.title;
                compInfo.abstract = j.abstract || '';
              }
            } else {
              $rootScope.$broadcast(
                'compositions.composition_loading',
                compInfo
              );
              HsEventBusService.compositionLoads.next(compInfo);
            }
            //const saveStatus = me.status ? 'ok' : 'not-saved';
            //me.statusData.success = me.status;
            resolve({
              status,
            });
            /*               $rootScope.$broadcast(
                'StatusManager.saveResult',
                'saveResult',
                saveStatus
              ); */
          })
          .catch((e) => {
            //e contains the json responses data object from api
            //me.statusData.success = false;
            reject({
              status: false,
              error: e,
            });
            /* $rootScope.$broadcast(
                'StatusManager.saveResult',
                'saveResult',
                'error',
                e
              ); */
          });
      });
    },

    /**
     * Initialization of Status Creator from outside of component
     *
     * @function open
     * @memberof hs.save-map.controller
     */
    open() {
      HsLayoutService.setMainPanel('saveMap', true);
      me.refresh();
    },

    refresh() {
      me.compoData.layers = [];
      me.compoData.bbox = me.getCurrentExtent();
      HsMapService.map.getLayers().forEach((lyr) => {
        if (
          (angular.isUndefined(lyr.get('show_in_manager')) ||
            lyr.get('show_in_manager') == true) &&
          lyr.get('base') != true
        ) {
          me.compoData.layers.push({
            title: lyr.get('title'),
            checked: true,
            layer: lyr,
          });
        }
      });
      me.compoData.layers.sort((a, b) => {
        return a.layer.get('position') - b.layer.get('position');
      });
      me.fillGroups(() => {
        me.statusData.groups.unshift({
          roleTitle: 'Public',
          roleName: 'guest',
          w: false,
          r: false,
        });
        const cc = me.compoData.currentComposition;
        if (angular.isDefined(me.compoData.currentComposition) && cc != '') {
          angular.forEach(me.statusData.groups, (g) => {
            if (
              angular.isDefined(cc.groups) &&
              angular.isDefined(cc.groups[g.roleName])
            ) {
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
     *
     * @function fillGroups
     * @param {Function} cb Callback function
     * @memberof HsSaveMapManagerService
     */
    fillGroups(cb) {
      me.statusData.groups = [];
      if (HsConfig.advancedForm) {
        $http({
          url: HsStatusManagerService.endpointUrl(),
          method: 'GET',
          data: {
            request: 'getGroups',
          },
        }).then(
          (response) => {
            const j = response.data;
            if (j.success) {
              me.statusData.groups = j.result;
              angular.forEach(me.statusData.groups, (g) => {
                g.w = false;
                g.r = false;
              });
            }
            cb();
          },
          (err) => {}
        );
      } else {
        cb();
      }
    },

    /**
     * Get User info from server and call callback (setUserDetail)
     *
     * @function loadUserDetails
     * @memberof HsSaveMapManagerService
     */
    loadUserDetails() {
      $http({
        url: HsStatusManagerService.endpointUrl() + '?request=getuserinfo',
      }).then(me.setUserDetails, (err) => {});
    },

    /**
     * Process user info into controller model, so they can be used in Save composition forms
     *
     * @function setUserDetails
     * @memberof HsSaveMapManagerService
     * @param {object} response Http response containig user data
     */
    setUserDetails(response) {
      const user = response.data;
      if (user && user.success == true) {
        // set the values
        if (user.userInfo) {
          me.userData.email = user.userInfo.email;
          me.userData.phone = user.userInfo.phone;
          me.userData.name =
            user.userInfo.firstName + ' ' + user.userInfo.lastName;
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
     *
     * @function getCurrentExtent
     * @memberof HsSaveMapManagerService
     * @returns {Array} Extent coordinates
     */
    getCurrentExtent() {
      const b = HsMapService.map
        .getView()
        .calculateExtent(HsMapService.map.getSize());
      let pair1 = [b[0], b[1]];
      let pair2 = [b[2], b[3]];
      const cur_proj = HsMapService.map.getView().getProjection().getCode();
      pair1 = transform(pair1, cur_proj, 'EPSG:4326');
      pair2 = transform(pair2, cur_proj, 'EPSG:4326');
      return [
        pair1[0].toFixed(2),
        pair1[1].toFixed(2),
        pair2[0].toFixed(2),
        pair2[1].toFixed(2),
      ];
    },

    resetCompoData() {
      me.compoData.id = me.compoData.abstract = me.compoData.title = me.compoData.currentCompositionTitle = me.compoData.keywords = me.compoData.currentComposition =
        '';
    },
  });

  $rootScope.$on('StatusCreator.open', (e, composition) => {
    me.open();
  });

  HsEventBusService.compositionLoads.subscribe((data) => {
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

  HsEventBusService.mapResets.subscribe(() => {
    me.resetCompoData();
  });

  HsEventBusService.mainPanelChanges.subscribe(() => {
    if (
      HsLayoutService.mainpanel == 'saveMap' ||
      HsLayoutService.mainpanel == 'statusCreator'
    ) {
      me.refresh();
      HsSaveMapService.generateThumbnail(
        HsLayoutService.contentWrapper.querySelector('.hs-stc-thumbnail'),
        me.compoData
      );
    }
  });

  HsEventBusService.olMapLoads.subscribe((map) => {
    map.on(
      'postcompose',
      HsUtilsService.debounce(
        () => {
          me.compoData.bbox = me.getCurrentExtent();
          HsSaveMapService.generateThumbnail(
            HsLayoutService.contentWrapper.querySelector('.hs-stc-thumbnail'),
            me.compoData
          );
        },
        1000,
        false,
        me
      )
    );
  });

  return me;
}
