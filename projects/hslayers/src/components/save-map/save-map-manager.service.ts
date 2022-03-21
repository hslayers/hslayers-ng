import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {BehaviorSubject, Subject, lastValueFrom} from 'rxjs';
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

export class HsSaveMapManagerParams {
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
  saveMapResulted: Subject<{statusData; app: string}> = new Subject();
  endpointSelected: BehaviorSubject<any> = new BehaviorSubject(null);
  preSaveCheckCompleted: Subject<{endpoint; app: string}> = new Subject();
  changeTitle: boolean;
  currentUser: boolean;
  missingTitle = false;
  missingName = false;
  missingAbstract = false;

  constructor() {}
}

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapManagerService {
  apps: {
    [id: string]: HsSaveMapManagerParams;
  } = {
    default: new HsSaveMapManagerParams(),
  };

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
    this.HsEventBusService.compositionLoads.subscribe(({data, app}) => {
      if (data.error == undefined) {
        const appRef = this.get(app);
        const responseData = data.data ?? data;
        appRef.compoData.id = responseData.id;
        appRef.compoData.abstract = responseData.abstract;
        appRef.compoData.title = responseData.title;
        appRef.compoData.name = responseData.name;
        appRef.compoData.keywords = responseData.keywords;
        appRef.compoData.currentComposition = responseData;
        appRef.compoData.workspace = responseData.workspace;
        appRef.compoData.currentCompositionTitle = appRef.compoData.title;
        if (Object.keys(data).length !== 0) {
          this.validateForm(app);
        }
      }
    });

    this.HsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      if (
        this.HsLayoutService.apps[app].mainpanel == 'saveMap' ||
        this.HsLayoutService.apps[app].mainpanel == 'statusCreator'
      ) {
        this.init(app);
      }
    });

    this.HsEventBusService.olMapLoads.subscribe(({map, app}) => {
      this.setCurrentBoundingBox(app);
      map.on(
        'postcompose',
        this.HsUtilsService.debounce(
          () => {
            if (this.HsLayoutService.apps[app].mainpanel == 'saveMap') {
              this.setCurrentBoundingBox(app);
              this.HsSaveMapService.generateThumbnail(
                this.HsLayoutService.apps[app].contentWrapper.querySelector(
                  '.hs-stc-thumbnail'
                ),
                this,
                app
              );
            }
          },
          1000,
          false,
          this
        )
      );
    });
  }

  get(app: string): HsSaveMapManagerParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsSaveMapManagerParams();
    }
    return this.apps[app ?? 'default'];
  }

  init(_app: string): void {
    this.HsMapService.loaded(_app).then(() => {
      this.fillCompositionData(_app);
      this.HsSaveMapService.generateThumbnail(
        this.HsLayoutService.apps[_app].contentWrapper.querySelector(
          '.hs-stc-thumbnail'
        ),
        this,
        _app
      );
    });
    this.HsEventBusService.mapResets.subscribe(({app}) => {
      if (app == _app) {
        this.resetCompoData(app);
      }
    });
  }

  //TODO: Add interface to describe Endpoint instead of any
  selectEndpoint(endpoint: any, app: string): void {
    this.get(app).endpointSelected.next(endpoint);
  }

  setCurrentBoundingBox(app: string): void {
    this.get(app).compoData.bbox = this.getCurrentExtent(app);
  }

  //*NOTE not being used
  async confirmSave(app: string): Promise<void> {
    try {
      const appRef = this.get(app);
      const response: any = await lastValueFrom(
        this.http.post(this.HsStatusManagerService.endpointUrl(app), {
          project: this.HsConfig.get(app).project_name,
          title: appRef.compoData.title,
          request: 'rightToSave',
        })
      );
      const j = response.data;
      appRef.statusData.hasPermission = j.results.hasPermission;
      appRef.statusData.titleFree = j.results.titleFree;
      if (j.results.guessedTitle) {
        appRef.statusData.guessedTitle = j.results.guessedTitle;
      }
      if (!appRef.statusData.titleFree) {
        appRef.statusData.changeTitle = false;
      }
      if (appRef.statusData.titleFree && appRef.statusData.hasPermission) {
        this.save(
          true,
          this.HsStatusManagerService.findStatusmanagerEndpoint(),
          app
        );
      }
      appRef.preSaveCheckCompleted.next({
        endpoint: this.HsStatusManagerService.findStatusmanagerEndpoint(),
        app,
      });
    } catch (ex) {
      this.get(app).statusData.success = false;
    }
  }

  save(saveAsNew, endpoint, app: string) {
    return new Promise((resolve, reject) => {
      const tempCompoData: any = {};
      Object.assign(tempCompoData, this.get(app).compoData);
      // Check whether layers were already formatted
      if (tempCompoData.layers[0].layer) {
        tempCompoData.layers = tempCompoData.layers
          .filter((l) => l.checked)
          .map((l) => l.layer);
      }
      const compositionJson = this.generateCompositionJson(app, tempCompoData);
      let saver: HsSaverService = this.HsStatusManagerService;
      if (endpoint.type == 'layman') {
        saver = this.HsLaymanService;
      }
      saver
        .save(compositionJson, endpoint, tempCompoData, saveAsNew, app)
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
            this.HsEventBusService.compositionLoads.next({data: compInfo, app});
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
   * @param download - Used when generating json for catalogue save
   * @returns composition JSON
   */
  generateCompositionJson(app: string, compoData?): any {
    /*TODO: REFACTOR
      Workaround for composition JSON generated for download. 
      Should be handled differently and generated only once. Task for upcoming component rework
    */
    const appRef = this.get(app);
    const tempCompoData: any = {...(compoData ?? appRef.compoData)};
    if (!compoData) {
      tempCompoData.layers = tempCompoData.layers
        .filter((l) => l.checked)
        .map((l) => l.layer);
    }

    return this.HsSaveMapService.map2json(
      this.HsMapService.getMap(app),
      tempCompoData,
      appRef.userData,
      appRef.statusData,
      app
    );
  }

  /**
   * Initialization of Save map wizard from outside of component
   * @param composition -
   */
  openPanel(composition, app: string) {
    this.HsLayoutService.setMainPanel('saveMap', app, true);
    this.fillCompositionData(app);
    this.get(app).panelOpened.next({composition});
  }

  private async fillCompositionData(app: string) {
    const appRef = this.get(app);
    this.fillLayers(app);
  }

  private fillLayers(app: string) {
    const compoData = this.get(app).compoData;
    compoData.layers = [];
    compoData.bbox = this.getCurrentExtent(app);
    compoData.layers = this.HsMapService.getMap(app)
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
   * Process user info into controller model, so they can be used in Save composition forms
   * @param response - Http response containing user data
   */
  setUserDetails(response, app: string) {
    const appRef = this.get(app);
    const user = response.data;
    if (user && user.success == true) {
      // set the values
      if (user.userInfo) {
        appRef.userData.email = user.userInfo.email;
        appRef.userData.phone = user.userInfo.phone;
        appRef.userData.name =
          user.userInfo.firstName + ' ' + user.userInfo.lastName;
      }
      if (user.userInfo && user.userInfo.org) {
        appRef.userData.address = user.userInfo.org.street;
        appRef.userData.country = user.userInfo.org.state;
        appRef.userData.postalcode = user.userInfo.org.zip;
        appRef.userData.city = user.userInfo.org.city;
        appRef.userData.organization = user.userInfo.org.name;
      }
    }
  }

  /**
   * Get current extent of map, transform it into EPSG:4326 and save it into controller model
   * Returns Extent coordinates
   */
  getCurrentExtent(app: string) {
    const b = this.HsMapService.getMap(app)
      .getView()
      .calculateExtent(this.HsMapService.getMap(app).getSize());
    let pair1 = [b[0], b[1]];
    let pair2 = [b[2], b[3]];
    const cur_proj = this.HsMapService.getCurrentProj(app).getCode();
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
  selectNewTitle(app: string) {
    const appRef = this.get(app);
    appRef.compoData.title = appRef.statusData.guessedTitle;
    appRef.changeTitle = true;
  }

  validateForm(app: string) {
    const appRef = this.get(app);
    appRef.missingTitle = !appRef.compoData.title;
    appRef.missingName = !appRef.compoData.name;
    appRef.missingAbstract = !appRef.compoData.abstract;
    return (
      !!appRef.compoData.title &&
      !!appRef.compoData.name &&
      !!appRef.compoData.abstract
    );
  }

  resetCompoData(app: string) {
    const appRef = this.get(app);
    appRef.compoData.id = '';
    appRef.compoData.abstract = '';
    appRef.compoData.title = '';
    appRef.compoData.name = '';
    appRef.compoData.currentCompositionTitle = '';
    appRef.compoData.keywords = '';
    appRef.compoData.currentComposition = '';
  }

  async initiateSave(saveAsNew, app: string) {
    if (!this.validateForm(app)) {
      console.log('validationfailed');
      return;
    }
    try {
      const augmentedResponse = await this.save(
        saveAsNew,
        this.get(app).endpointSelected.getValue(),
        app
      );
      this.processSaveCallback(augmentedResponse, app);
    } catch (ex) {
      console.error(ex);
      this.processSaveCallback(ex, app);
    }
  }

  processSaveCallback(response, app) {
    const appRef = this.get(app);
    appRef.statusData.status = response.status;
    if (!response.status) {
      if (response.code == 24) {
        appRef.statusData.overWriteNeeded = true;
        appRef.compoData.name = response.detail.mapname;
        appRef.statusData.resultCode = 'exists';
      } else if (response.code == 32) {
        appRef.statusData.resultCode = 'not-saved';
      } else {
        appRef.statusData.resultCode = 'error';
      }
      appRef.statusData.error = response;
    } else {
      this.HsLayoutService.setMainPanel('layermanager', app, true);
    }
    appRef.saveMapResulted.next({statusData: appRef.statusData, app});
  }

  focusTitle(app: string) {
    const appRef = this.get(app);
    if (appRef.statusData.guessedTitle) {
      appRef.compoData.title = appRef.statusData.guessedTitle;
    }
    //TODO Check if this works and input is focused
    this.HsLayoutService.get(app)
      .contentWrapper.querySelector('.hs-stc-title')
      .focus();
  }
}
