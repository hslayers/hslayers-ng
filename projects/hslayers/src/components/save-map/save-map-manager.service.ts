import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {BehaviorSubject, Subject, lastValueFrom} from 'rxjs';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {BoundingBoxObject} from './types/bounding-box-object.type';
import {CompoData} from './types/compo-data.type';
import {HsConfig} from '../../config.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLaymanService} from './layman.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsLogService} from './../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from './save-map.service';
import {HsSaverService} from './interfaces/saver-service.interface';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsStatusManagerService} from './status-manager.service';
import {HsUtilsService} from '../utils/utils.service';
import {MapComposition} from './types/map-composition.type';
import {StatusData} from './types/status-data.type';
import {UserData} from './types/user-data.type';
import {accessRightsModel} from '../add-data/common/access-rights.model';
import {getShowInLayerManager, getTitle} from '../../common/layer-extensions';

export class HsSaveMapManagerParams {
  statusData: StatusData = {
    titleFree: undefined,
    hasPermission: undefined,
    success: undefined,
    changeTitle: undefined,
    groups: [],
  };
  compoData: CompoData = {
    name: '',
    abstract: '',
    keywords: '',
    layers: [],
    id: '',
    thumbnail: undefined,
    bbox: <BoundingBoxObject>{east: '0', south: '0', west: '0', north: '0'},
    currentCompositionTitle: '',
    currentComposition: undefined,
    access_rights: <accessRightsModel>{
      'access_rights.write': 'private',
      'access_rights.read': 'EVERYONE',
    },
  };
  userData: UserData = {
    email: '',
    phone: '',
    name: '',
    address: '',
    country: '',
    postalCode: '',
    city: '',
    organization: '',
    position: '',
    state: '',
  };
  panelOpened: Subject<any> = new Subject();
  saveMapResulted: Subject<{statusData; app: string}> = new Subject();
  endpointSelected: BehaviorSubject<HsEndpoint> = new BehaviorSubject(null);
  preSaveCheckCompleted: Subject<{endpoint; app: string}> = new Subject();
  changeTitle: boolean;
  currentUser: string;
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
    private hsMapService: HsMapService,
    private hsSaveMapService: HsSaveMapService,
    private hsConfig: HsConfig,
    private http: HttpClient,
    private hsShareUrlService: HsShareUrlService,
    private hsStatusManagerService: HsStatusManagerService,
    private hsLaymanService: HsLaymanService,
    private hsLayoutService: HsLayoutService,
    private hsUtilsService: HsUtilsService,
    private hsEventBusService: HsEventBusService,
    private hsLogService: HsLogService
  ) {
    this.hsEventBusService.compositionLoads.subscribe(({data, app}) => {
      if (data.error == undefined) {
        const appRef = this.get(app);
        const responseData = data.data ?? data;
        appRef.compoData.id = responseData.id;
        appRef.compoData.abstract = responseData.abstract;
        appRef.compoData.name = responseData.name;
        appRef.compoData.keywords = responseData.keywords;
        appRef.compoData.currentComposition = responseData;
        appRef.compoData.workspace = responseData.workspace;
        appRef.compoData.currentCompositionTitle = appRef.compoData.name;
        if (Object.keys(data).length !== 0) {
          this.validateForm(app);
        }
      }
    });

    this.hsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      if (
        this.hsLayoutService.apps[app].mainpanel == 'saveMap' ||
        this.hsLayoutService.apps[app].mainpanel == 'statusCreator'
      ) {
        this.init(app);
      }
    });

    this.hsEventBusService.olMapLoads.subscribe(({map, app}) => {
      this.setCurrentBoundingBox(app);
      map.on(
        'postcompose',
        this.hsUtilsService.debounce(
          () => {
            if (this.hsLayoutService.apps[app].mainpanel == 'saveMap') {
              this.setCurrentBoundingBox(app);
              this.hsSaveMapService.generateThumbnail(
                this.hsLayoutService.apps[app].contentWrapper.querySelector(
                  '.hs-stc-thumbnail'
                ),
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

  /**
   * Get the params saved by the saveMapManagerService for the current app
   * @param app - App identifier
   */
  get(app: string): HsSaveMapManagerParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsSaveMapManagerParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Initialize the saveMapManagerService data and subscribers
   * @param _app - App identifier
   */
  init(_app: string): void {
    this.hsMapService.loaded(_app).then(() => {
      this.fillCompositionLayers(_app);
      this.hsSaveMapService.generateThumbnail(
        this.hsLayoutService.apps[_app].contentWrapper.querySelector(
          '.hs-stc-thumbnail'
        ),
        _app
      );
    });
    this.hsEventBusService.mapResets.subscribe(({app}) => {
      if (app == _app) {
        this.resetCompoData(app);
      }
    });
  }

  /**
   * Select the endpoint
   * @param app - Endpoint's description
   * @param app - App identifier
   */
  selectEndpoint(endpoint: HsEndpoint, app: string): void {
    this.get(app).endpointSelected.next(endpoint);
  }

  /**
   * Set composition's data bounding box to the current OL map view extent
   * @param app - App identifier
   */
  setCurrentBoundingBox(app: string): void {
    this.get(app).compoData.bbox = this.hsMapService.describeExtent(app);
  }

  /**
   * Request confirmation if the composition is ready to be saved
   * NOTE not being used
   * @param app - App identifier
   */
  async confirmSave(app: string): Promise<void> {
    try {
      const appRef = this.get(app);
      const response: any = await lastValueFrom(
        this.http.post(this.hsShareUrlService.endpointUrl(app), {
          project: this.hsConfig.get(app).project_name,
          title: appRef.compoData.name,
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
          this.hsStatusManagerService.findStatusmanagerEndpoint(),
          app
        );
      }
      appRef.preSaveCheckCompleted.next({
        endpoint: this.hsStatusManagerService.findStatusmanagerEndpoint(),
        app,
      });
    } catch (ex) {
      this.get(app).statusData.success = false;
    }
  }

  /**
   * Save composition to external service database
   * @param saveAsNew - Save as new composition
   * @param endpoint - Endpoint's description
   * @param app - App identifier
   * @returns Promise result of POST
   */
  save(saveAsNew: boolean, endpoint: HsEndpoint, app: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const tempCompoData: CompoData = {};
      Object.assign(tempCompoData, this.get(app).compoData);
      // Check whether layers were already formatted
      if (tempCompoData.layers[0].layer) {
        tempCompoData.layers = tempCompoData.layers.filter((l) => l.checked);
      }
      const compositionJson = this.generateCompositionJson(app, tempCompoData);
      let saver: HsSaverService = this.hsStatusManagerService;
      if (endpoint.type.includes('layman')) {
        saver = this.hsLaymanService;
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
          if (endpoint.type.includes('layman')) {
            if (saveAsNew) {
              status = j.length == 1 && j[0].uuid !== undefined;
            } else {
              status = j.uuid !== undefined;
            }
          }
          if (!status) {
            if (endpoint.type.includes('layman') && j.status == 'CONFLICT') {
              compInfo.id = j[0].uuid;
              compInfo.name = j[0].name;
            }
            if (endpoint.type == 'statusmanager') {
              compInfo.id = j.id;
              compInfo.title = j.title;
              compInfo.abstract = j.abstract || '';
            }
          } else {
            this.hsEventBusService.compositionLoading.next(compInfo);
            this.hsEventBusService.compositionLoads.next({data: compInfo, app});
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
   * Generate composition JSON for downloading
   * @param app - App identifier
   * @param compoData - Additional data for composition
   * @returns composition JSON
   */
  generateCompositionJson(app: string, compoData?: CompoData): MapComposition {
    /*TODO: REFACTOR
      Workaround for composition JSON generated for download. 
      Should be handled differently and generated only once. Task for upcoming component rework
    */
    const appRef = this.get(app);
    const tempCompoData: CompoData = {...(compoData ?? appRef.compoData)};
    if (!compoData) {
      tempCompoData.layers = tempCompoData.layers.filter((l) => l.checked);
    }

    return this.hsSaveMapService.map2json(
      this.hsMapService.getMap(app),
      tempCompoData,
      appRef.userData,
      appRef.statusData,
      app
    );
  }

  /**
   * Initialization of Save map wizard from outside of component
   * @param composition - Composition selected from the compositions list
   * @param app - App identifier
   */
  openPanel(composition, app: string): void {
    this.hsLayoutService.setMainPanel('saveMap', app, true);
    this.fillCompositionLayers(app);
    this.get(app).panelOpened.next({composition});
  }

  /**
   * Fill composition's layers from the OL map layers list
   * @param app - App identifier
   */
  private fillCompositionLayers(app: string): void {
    const compoData = this.get(app).compoData;
    compoData.layers = [];
    compoData.bbox = this.hsMapService.describeExtent(app);
    compoData.layers = this.hsMapService
      .getMap(app)
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
   * Process user's info into controller model, so they can be used in Save composition forms
   * @param response - HTTP response containing user data
   * @param app - App identifier
   */
  setUserDetails(response, app: string): void {
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
        appRef.userData.postalCode = user.userInfo.org.zip;
        appRef.userData.city = user.userInfo.org.city;
        appRef.userData.organization = user.userInfo.org.name;
      }
    }
  }

  /**
   * Callback for saving with new name
   * @param app - App identifier
   */
  selectNewName(app: string): void {
    const appRef = this.get(app);
    appRef.compoData.name = appRef.statusData.guessedTitle;
    appRef.changeTitle = true;
  }

  /**
   * Check if the composition's input form is valid
   * @param app - App identifier
   * @returns True if the form is valid, false otherwise
   */
  validateForm(app: string): boolean {
    const appRef = this.get(app);
    appRef.missingName = !appRef.compoData.name;
    appRef.missingAbstract = !appRef.compoData.abstract;
    return !!appRef.compoData.name && !!appRef.compoData.abstract;
  }

  /**
   * Reset localy stored composition's input data to default values
   * @param app - App identifier
   */
  resetCompoData(app: string): void {
    const appRef = this.get(app);
    appRef.compoData.id = '';
    appRef.compoData.abstract = '';
    appRef.compoData.name = '';
    appRef.compoData.currentCompositionTitle = '';
    appRef.compoData.keywords = '';
    appRef.compoData.currentComposition = '';
  }

  /**
   * Initiate composition's saving procedure
   * @param saveAsNew - If true save a new composition, otherwise overwrite to current one
   * @param app - App identifier
   */
  async initiateSave(saveAsNew: boolean, app: string): Promise<void> {
    if (!this.validateForm(app)) {
      this.hsLogService.log('validationfailed');
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
      this.hsLogService.error(ex);
      this.processSaveCallback(ex, app);
    }
  }

  /**
   * Process response data after saving the composition
   * @param response - HTTP response after saving the composition
   * @param app - App identifier
   */
  processSaveCallback(response, app: string): void {
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
      this.hsLayoutService.setMainPanel('layermanager', app, true);
    }
    appRef.saveMapResulted.next({statusData: appRef.statusData, app});
  }

  /**
   * Focus the browser to composition's title
   * @param app - App identifier
   */
  focusTitle(app: string) {
    const appRef = this.get(app);
    if (appRef.statusData.guessedTitle) {
      appRef.compoData.name = appRef.statusData.guessedTitle;
    }
    //TODO Check if this works and input is focused
    this.hsLayoutService
      .get(app)
      .contentWrapper.querySelector('.hs-stc-title')
      .focus();
  }
}
