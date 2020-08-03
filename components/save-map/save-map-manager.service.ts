/* eslint-disable angular/on-watch */
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanService} from './layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from './save-map.service';
import {HsStatusManagerService} from './status-manager.service';
import {HsUtilsService} from '../utils/utils.service';
import {HttpClient} from '@angular/common/http';
import {SaverServiceInterface} from './saver-service.interface';
import {Subject} from 'rxjs';
import {transform} from 'ol/proj';

export class HsSaveMapManagerService {
  statusData: any = {
    titleFree: undefined,
    hasPermission: undefined,
    success: undefined,
    changeTitle: undefined,
    groups: [],
  };
  compoData: any = {
    title: '',
    abstract: '',
    keywords: [],
    layers: [],
    id: '',
    thumbnail: undefined,
    bbox: undefined,
    currentCompositionTitle: '',
    currentComposition: undefined,
  };
  userData: any = {
    email: '',
    phone: '',
    name: '',
    address: '',
    country: '',
    postalCode: '',
    city: '',
    organization: '',
  };
  panelOpened: Subject<any> = new Subject();
  constructor(
    private HsMapService: HsMapService,
    private HsSaveMapService: HsSaveMapService,
    private HsConfig: HsConfig,
    private http: HttpClient,
    private HsStatusManagerService: HsStatusManagerService,
    private HsLaymanService: HsLaymanService,
    private HsLayoutService: HsLayoutService,
    private HsUtilsService: HsUtilsService,
    private HsEventBusService: HsEventBusService
  ) {
    HsEventBusService.compositionLoads.subscribe((data) => {
      if (data.error == undefined) {
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
        this.fillCompositionData();
        this.HsSaveMapService.generateThumbnail(
          this.HsLayoutService.contentWrapper.querySelector(
            '.hs-stc-thumbnail'
          ),
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
              this.HsLayoutService.contentWrapper.querySelector(
                '.hs-stc-thumbnail'
              ),
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

  async confirmSave() {
    try {
      const response: any = await this.http
        .post(this.HsStatusManagerService.endpointUrl(), {
          project: this.HsConfig.project_name,
          title: this.compoData.title,
          request: 'rightToSave',
        })
        .toPromise();
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
    } catch (ex) {
      this.statusData.success = false;
      this.$rootScope.$broadcast(
        'StatusManager.saveResult',
        'saveResult',
        'error'
      );
    }
  }

  save(saveAsNew, endpoint) {
    return new Promise((resolve, reject) => {
      const compositionJson = this.HsSaveMapService.map2json(
        this.HsMapService.map,
        this.compoData,
        this.userData,
        this.statusData
      );
      let saver: SaverServiceInterface = this.HsStatusManagerService;
      if (endpoint.type == 'layman') {
        saver = this.HsLaymanService;
      }
      saver
        .save(compositionJson, endpoint, this.compoData, saveAsNew)
        .then((response) => {
          const compInfo: any = {};
          const j = response.data;
          let status = false;
          if (endpoint.type == 'statusmanager') {
            status = j.saved;
          }
          if (endpoint.type == 'layman') {
            if (saveAsNew) {
              status = j.length == 1 && j[0].uuid !== undefined;
            } else {
              status = j.uuid !== undefined;
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
   * Initialization of Save map wizard from outside of component
   *
   * @param composition
   * @function openPanel
   * @memberof hs.HsSaveMapManagerService
   */
  openPanel(composition) {
    this.HsLayoutService.setMainPanel('saveMap', true);
    this.fillCompositionData();
    this.panelOpened.next({composition});
  }

  private fillCompositionData() {
    this.fillLayers();
    this.fillGroups(() => {
      this.statusData.groups.unshift({
        roleTitle: 'Public',
        roleName: 'guest',
        w: false,
        r: false,
      });
      const cc = this.compoData.currentComposition;
      if (this.compoData.currentComposition && cc != '') {
        for (const g of this.statusData.groups) {
          if (cc.groups && cc.groups[g.roleName]) {
            g.w = cc.groups[g.roleName].indexOf('w') > -1;
            g.r = cc.groups[g.roleName].indexOf('r') > -1;
          }
        }
      }
    });
    this.loadUserDetails();
  }

  private fillLayers() {
    this.compoData.layers = [];
    this.compoData.bbox = this.getCurrentExtent();
    this.HsMapService.map.getLayers().forEach((lyr) => {
      if (
        (lyr.get('show_in_manager') == undefined ||
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
  }

  /**
   * Send getGroups request to status manager server and process response
   *
   * @function fillGroups
   * @param {Function} cb Callback function
   * @memberof HsSaveMapManagerService
   */
  fillGroups(cb) {
    //TODO rewrite fillGroups as Promise
    this.statusData.groups = [];
    if (this.HsConfig.advancedForm) {
      this.http({
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
            for (const g of this.statusData.groups) {
              g.w = false;
              g.r = false;
            }
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
  async loadUserDetails() {
    const response: any = await this.http
      .get(this.HsStatusManagerService.endpointUrl() + '?request=getuserinfo')
      .toPromise();
    this.setUserDetails(response);
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
