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
export class HsSaveMapManagerService {
  constructor(
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

    Object.assign(this, {
      $rootScope,
      HsMapService,
      HsSaveMapService,
      HsConfig,
      $http,
      HsStatusManagerService,
      HsLaymanService,
      HsLayoutService,
      HsUtilsService,
      HsEventBusService,
    });

    Object.assign(this, {
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
    });

    $rootScope.$on('StatusCreator.open', (e, composition) => {
      this.open();
    });

    HsEventBusService.compositionLoads.subscribe((data) => {
      if (angular.isUndefined(data.error)) {
        if (data.data) {
          this.compoData.id = data.id;
          this.compoData.abstract = data.data.abstract;
          this.compoData.title = data.data.title;
          this.compoData.keywords = data.data.keywords;
          this.compoData.currentComposition = data.data;
        } else {
          this.compoData.id = data.id;
          this.compoData.abstract = data.abstract;
          this.compoData.title = data.title;
          this.compoData.keywords = data.keywords;
          this.compoData.currentComposition = data;
        }

        this.compoData.currentCompositionTitle = this.compoData.title;
      }
    });

    HsEventBusService.mapResets.subscribe(() => {
      this.resetCompoData();
    });

    HsEventBusService.mainPanelChanges.subscribe(() => {
      if (
        HsLayoutService.mainpanel == 'saveMap' ||
        HsLayoutService.mainpanel == 'statusCreator'
      ) {
        this.refresh();
        HsSaveMapService.generateThumbnail(
          HsLayoutService.contentWrapper.querySelector('.hs-stc-thumbnail'),
          this.compoData
        );
      }
    });

    this.HsEventBusService.olMapLoads.subscribe((map) => {
      map.on(
        'postcompose',
        this.HsUtilsService.debounce(
          () => {
            this.compoData.bbox = this.getCurrentExtent();
            this.HsSaveMapService.generateThumbnail(
              this.HsLayoutService.contentWrapper.querySelector('.hs-stc-thumbnail'),
              this.compoData
            );
          },
          1000,
          false,
          this
        )
      );
    });
  }

  /**
   * Select or deselect all layers
   *
   * @function selectDeselectAllLayers
   * @memberof hs.save-map
   */
  selectDeselectAllLayers() {
    this.btnSelectDeseletClicked = !this.btnSelectDeseletClicked;
    this.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeseletClicked)
    );
  }

  confirmSave() {
    this.$http({
      method: 'POST',
      url: this.HsStatusManagerService.endpointUrl(),
      data: angular.toJson({
        project: this.HsConfig.project_name,
        title: this.compoData.title,
        request: 'rightToSave',
      }),
    }).then(
      (response) => {
        const j = response.data;
        this.statusData.hasPermission = j.results.hasPermission;
        this.statusData.titleFree = j.results.titleFree;
        if (j.results.guessedTitle) {
          this.statusData.guessedTitle = j.results.guessedTitle;
        }
        if (!this.statusData.titleFree) {
          this.statusData.changeTitle = false;
        }
        if (this.statusData.titleFree && this.statusData.hasPermission) {
          this.save(true);
        } else {
          this.$rootScope.$broadcast('StatusManager.saveResult', 'saveConfirm');
        }
      },
      (err) => {
        this.statusData.success = false;
        this.$rootScope.$broadcast(
          'StatusManager.saveResult',
          'saveResult',
          'error'
        );
      }
    );
  }

  save(saveAsNew, endpoint) {
    return new Promise((resolve, reject) => {
      const compositionJson = this.HsSaveMapService.map2json(
        this.HsMapService.map,
        this.compoData,
        this.userData,
        this.statusData
      );
      let saver = this.HsStatusManagerService;
      if (endpoint.type == 'layman') {
        saver = this.HsLaymanService;
      }
      saver
        .save(compositionJson, endpoint, this.compoData, saveAsNew)
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
            this.$rootScope.$broadcast(
              'compositions.composition_loading',
              compInfo
            );
            this.HsEventBusService.compositionLoads.next(compInfo);
          }
          //const saveStatus = this.status ? 'ok' : 'not-saved';
          //this.statusData.success = this.status;
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
          //this.statusData.success = false;
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
  }

  /**
   * Initialization of Status Creator from outside of component
   *
   * @function open
   * @memberof hs.save-map.controller
   */
  open() {
    this.HsLayoutService.setMainPanel('saveMap', true);
    this.refresh();
  }

  refresh() {
    this.compoData.layers = [];
    this.compoData.bbox = this.getCurrentExtent();
    this.HsMapService.map.getLayers().forEach((lyr) => {
      if (
        (angular.isUndefined(lyr.get('show_in_manager')) ||
          lyr.get('show_in_manager') == true) &&
        lyr.get('base') != true
      ) {
        this.compoData.layers.push({
          title: lyr.get('title'),
          checked: true,
          layer: lyr,
        });
      }
    });
    this.compoData.layers.sort((a, b) => {
      return a.layer.get('position') - b.layer.get('position');
    });
    this.fillGroups(() => {
      this.statusData.groups.unshift({
        roleTitle: 'Public',
        roleName: 'guest',
        w: false,
        r: false,
      });
      const cc = this.compoData.currentComposition;
      if (angular.isDefined(this.compoData.currentComposition) && cc != '') {
        angular.forEach(this.statusData.groups, (g) => {
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
    this.loadUserDetails();
  }

  /**
   * Send getGroups request to status manager server and process response
   *
   * @function fillGroups
   * @param {Function} cb Callback function
   * @memberof HsSaveMapManagerService
   */
  fillGroups(cb) {
    this.statusData.groups = [];
    if (this.HsConfig.advancedForm) {
      this.$http({
        url: this.HsStatusManagerService.endpointUrl(),
        method: 'GET',
        data: {
          request: 'getGroups',
        },
      }).then(
        (response) => {
          const j = response.data;
          if (j.success) {
            this.statusData.groups = j.result;
            angular.forEach(this.statusData.groups, (g) => {
              g.w = false;
              g.r = false;
            });
          }
          cb();
        },
        (err) => {
          //Nothing
        }
      );
    } else {
      cb();
    }
  }

  /**
   * Get User info from server and call callback (setUserDetail)
   *
   * @function loadUserDetails
   * @memberof HsSaveMapManagerService
   */
  loadUserDetails() {
    this.$http({
      url: this.HsStatusManagerService.endpointUrl() + '?request=getuserinfo',
    }).then(this.setUserDetails, (err) => {
      //Nothing
    });
  }

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
        this.userData.email = user.userInfo.email;
        this.userData.phone = user.userInfo.phone;
        this.userData.name =
          user.userInfo.firstName + ' ' + user.userInfo.lastName;
      }
      if (user.userInfo && user.userInfo.org) {
        this.userData.address = user.userInfo.org.street;
        this.userData.country = user.userInfo.org.state;
        this.userData.postalcode = user.userInfo.org.zip;
        this.userData.city = user.userInfo.org.city;
        this.userData.organization = user.userInfo.org.name;
      }
    }
  }

  /**
   * Get current extent of map, transform it into EPSG:4326 and save it into controller model
   *
   * @function getCurrentExtent
   * @memberof HsSaveMapManagerService
   * @returns {Array} Extent coordinates
   */
  getCurrentExtent() {
    const b = this.HsMapService.map
      .getView()
      .calculateExtent(this.HsMapService.map.getSize());
    let pair1 = [b[0], b[1]];
    let pair2 = [b[2], b[3]];
    const cur_proj = this.HsMapService.map.getView().getProjection().getCode();
    pair1 = transform(pair1, cur_proj, 'EPSG:4326');
    pair2 = transform(pair2, cur_proj, 'EPSG:4326');
    return [
      pair1[0].toFixed(2),
      pair1[1].toFixed(2),
      pair2[0].toFixed(2),
      pair2[1].toFixed(2),
    ];
  }

  resetCompoData() {
    this.compoData.id = '';
    this.compoData.abstract = '';
    this.compoData.title = '';
    this.compoData.currentCompositionTitle = '';
    this.compoData.keywords = '';
    this.compoData.currentComposition = '';
  }
}
