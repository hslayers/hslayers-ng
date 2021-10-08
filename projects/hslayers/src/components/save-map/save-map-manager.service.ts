import {BehaviorSubject, Subject} from 'rxjs';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {transform} from 'ol/proj';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanService} from './layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from './save-map.service';
import {HsSaverService} from './saver-service.interface';
import {HsStatusManagerService} from './status-manager.service';
import {HsUtilsService} from '../utils/utils.service';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {accessRightsModel} from '../add-data/common/access-rights.model';
import {getShowInLayerManager, getTitle} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
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
    name: '',
    abstract: '',
    keywords: [],
    layers: [],
    id: '',
    thumbnail: undefined,
    bbox: {east: 0, south: 0, west: 0, north: 0},
    currentCompositionTitle: '',
    currentComposition: undefined,
    access_rights: <accessRightsModel>{
      'access_rights.write': 'private',
      'access_rights.read': 'EVERYONE',
    },
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
  saveMapResulted: Subject<any> = new Subject();
  endpointSelected: BehaviorSubject<any> = new BehaviorSubject(null);
  preSaveCheckCompleted: Subject<{endpoint}> = new Subject();
  changeTitle: boolean;
  currentUser: boolean;

  constructor(
    public HsMapService: HsMapService,
    public HsSaveMapService: HsSaveMapService,
    public HsConfig: HsConfig,
    private http: HttpClient,
    public HsStatusManagerService: HsStatusManagerService,
    public HsLaymanService: HsLaymanService,
    public HsLayoutService: HsLayoutService,
    public HsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService
  ) {
    HsEventBusService.compositionLoads.subscribe((data) => {
      if (data.error == undefined) {
        const responseData = data.data ?? data;

        this.compoData.id = responseData.id;
        this.compoData.abstract = responseData.abstract;
        this.compoData.title = responseData.title;
        this.compoData.name = responseData.name;
        this.compoData.keywords = responseData.keywords;
        this.compoData.currentComposition = responseData;
        this.compoData.workspace = responseData.workspace;

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
        HsMapService.loaded().then(() => {
          this.fillCompositionData();
          this.HsSaveMapService.generateThumbnail(
            this.HsLayoutService.contentWrapper.querySelector(
              '.hs-stc-thumbnail'
            ),
            this.compoData
          );
        });
      }
    });

    this.HsEventBusService.olMapLoads.subscribe((map) => {
      this.setCurrentBoundingBox();
      map.on(
        'postcompose',
        this.HsUtilsService.debounce(
          () => {
            this.setCurrentBoundingBox();
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

  //TODO: Add interface to describe Endpoint instead of any
  selectEndpoint(endpoint: any): void {
    this.endpointSelected.next(endpoint);
  }

  setCurrentBoundingBox(): void {
    this.compoData.bbox = this.getCurrentExtent();
  }

  async confirmSave(): Promise<void> {
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
        this.save(
          true,
          this.HsStatusManagerService.findStatusmanagerEndpoint()
        );
      }
      this.preSaveCheckCompleted.next({
        endpoint: this.HsStatusManagerService.findStatusmanagerEndpoint(),
      });
    } catch (ex) {
      this.statusData.success = false;
    }
  }

  save(saveAsNew, endpoint) {
    return new Promise((resolve, reject) => {
      const tempCompoData: any = {};
      Object.assign(tempCompoData, this.compoData);
      // Check whether layers were already formatted
      if (tempCompoData.layers[0].layer) {
        tempCompoData.layers = tempCompoData.layers
          .filter((l) => l.checked)
          .map((l) => l.layer);
      }
      const compositionJson = this.generateCompositionJson(tempCompoData);
      let saver: HsSaverService = this.HsStatusManagerService;
      if (endpoint.type == 'layman') {
        saver = this.HsLaymanService;
      }
      saver
        .save(compositionJson, endpoint, tempCompoData, saveAsNew)
        .then((response) => {
          const compInfo: any = {};
          const j = response;
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
            this.HsEventBusService.compositionLoading.next(compInfo);
            this.HsEventBusService.compositionLoads.next(compInfo);
          }
          //const saveStatus = this.status ? 'ok' : 'not-saved';
          //this.statusData.success = this.status;
          response.status = status;
          resolve(response);
        })
        .catch((e) => {
          //e contains the json responses data object from api
          //this.statusData.success = false;
          reject({
            status: false,
            error: e,
          });
        });
    });
  }

  /**
   * @param download Used when generating json for catalogue save
   * @returns composition JSON
   */
  generateCompositionJson(compoData?): any {
    /*TODO: REFACTOR
      Workaround for composition JSON generated for download. 
      Should be handled differently and generated only once. Task for upcoming component rework
    */
    const tempCompoData: any = {...(compoData ?? this.compoData)};
    if (!compoData) {
      tempCompoData.layers = tempCompoData.layers
        .filter((l) => l.checked)
        .map((l) => l.layer);
    }

    return this.HsSaveMapService.map2json(
      this.HsMapService.map,
      tempCompoData,
      this.userData,
      this.statusData
    );
  }

  /**
   * Initialization of Save map wizard from outside of component
   * @param composition
   */
  openPanel(composition) {
    this.HsLayoutService.setMainPanel('saveMap', true);
    this.fillCompositionData();
    this.panelOpened.next({composition});
  }

  private async fillCompositionData() {
    this.fillLayers();
    await this.fillGroups();
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
    this.loadUserDetails();
  }

  private fillLayers() {
    this.compoData.layers = [];
    this.compoData.bbox = this.getCurrentExtent();
    this.compoData.layers = this.HsMapService.map
      .getLayers()
      .getArray()
      .filter(
        (lyr: Layer<Source>) =>
          getShowInLayerManager(lyr) == undefined ||
          getShowInLayerManager(lyr) == true
      )
      .map((lyr: Layer<Source>) => {
        return {
          title: getTitle(lyr),
          checked: true,
          layer: lyr,
        };
      })
      .sort((a, b) => {
        return a.layer.getZIndex() - b.layer.getZIndex();
      });
  }

  /**
   * Send getGroups request to status manager server and process response
   * @param {Function} cb Callback function
   */
  async fillGroups(): Promise<void> {
    this.statusData.groups = [];
    if (this.HsConfig.advancedForm) {
      const response: any = await this.http
        .get(this.HsStatusManagerService.endpointUrl(), {
          params: new HttpParams({
            fromObject: {
              request: 'getGroups',
            },
          }),
        })
        .toPromise();
      const j = response.data;
      if (j.success) {
        this.statusData.groups = j.result;
        for (const g of this.statusData.groups) {
          g.w = false;
          g.r = false;
        }
      }
    }
  }

  /**
   * Get User info from server and call callback (setUserDetail)
   */
  async loadUserDetails() {
    const response: any = await this.http
      .get(this.HsStatusManagerService.endpointUrl() + '?request=getuserinfo')
      .toPromise();
    this.setUserDetails(response);
  }

  /**
   * Process user info into controller model, so they can be used in Save composition forms
   * @param {object} response Http response containing user data
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
   * @returns {Array} Extent coordinates
   */
  getCurrentExtent() {
    const b = this.HsMapService.map
      .getView()
      .calculateExtent(this.HsMapService.map.getSize());
    let pair1 = [b[0], b[1]];
    let pair2 = [b[2], b[3]];
    const cur_proj = this.HsMapService.getCurrentProj().getCode();
    pair1 = transform(pair1, cur_proj, 'EPSG:4326');
    pair2 = transform(pair2, cur_proj, 'EPSG:4326');
    return {
      east: pair1[0].toFixed(2),
      south: pair1[1].toFixed(2),
      west: pair2[0].toFixed(2),
      north: pair2[1].toFixed(2),
    };
  }

  /**
   * Callback for saving with new title
   */
  selectNewTitle() {
    this.compoData.title = this.statusData.guessedTitle;
    this.changeTitle = true;
  }

  resetCompoData() {
    this.compoData.id = '';
    this.compoData.abstract = '';
    this.compoData.title = '';
    this.compoData.name = '';
    this.compoData.currentCompositionTitle = '';
    this.compoData.keywords = '';
    this.compoData.currentComposition = '';
  }

  async initiateSave(saveAsNew) {
    try {
      const augmentedResponse = await this.save(
        saveAsNew,
        this.endpointSelected.getValue()
      );
      this.processSaveCallback(augmentedResponse);
    } catch (ex) {
      this.processSaveCallback(ex);
    }
  }

  processSaveCallback(response) {
    this.statusData.status = response.status;
    if (!response.status) {
      if (response.code == 24) {
        this.statusData.overWriteNeeded = true;
        this.compoData.name = response.detail.mapname;
        this.statusData.resultCode = 'exists';
      } else if (response.code == 32) {
        this.statusData.resultCode = 'not-saved';
      } else {
        this.statusData.resultCode = 'error';
      }
      this.statusData.error = response;
    } else {
      this.HsLayoutService.setMainPanel('layermanager', true);
    }
    this.saveMapResulted.next(this.statusData);
  }

  focusTitle() {
    if (this.statusData.guessedTitle) {
      this.compoData.title = this.statusData.guessedTitle;
    }
    //TODO Check if this works and input is focused
    this.HsLayoutService.contentWrapper.querySelector('.hs-stc-title').focus();
  }
}
