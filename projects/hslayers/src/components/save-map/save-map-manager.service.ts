import {BehaviorSubject, Subject} from 'rxjs';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

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
import {HsShareService} from '../permalink/share.service';
import {HsUtilsService} from '../utils/utils.service';
import {MapComposition} from './types/map-composition.type';
import {StatusData} from './types/status-data.type';
import {UserData} from './types/user-data.type';
import {accessRightsModel} from '../add-data/common/access-rights.model';
export class HsSaveMapManagerParams {
  statusData: StatusData = {
    titleFree: undefined,
    hasPermission: undefined,
    success: undefined,
    changeTitle: undefined,
    groups: [],
  };

  //TODO: USE REACTIVE FORM INSTEAD OF THIS
  currentComposition = undefined;

  compoData = new FormGroup({
    name: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    abstract: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    workspace: new FormControl({value: undefined}), //{value: undefined, disabled: true}
    keywords: new FormControl(''),

    id: new FormControl(''),
    thumbnail: new FormControl({value: undefined}),
    currentCompositionTitle: new FormControl(''),
    access_rights: new FormControl<accessRightsModel>({
      'access_rights.write': 'private',
      'access_rights.read': 'EVERYONE',
    }),
  });

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
  saveMapResulted: Subject<StatusData | string> = new Subject();
  endpointSelected: BehaviorSubject<HsEndpoint> = new BehaviorSubject(null);
  preSaveCheckCompleted: Subject<HsEndpoint> = new Subject();
  changeTitle: boolean;
  currentUser: string;
  missingName = false;
  missingAbstract = false;

  constructor() {}
}

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapManagerService extends HsSaveMapManagerParams {
  constructor(
    private hsMapService: HsMapService,
    private hsSaveMapService: HsSaveMapService,
    private hsConfig: HsConfig,
    private http: HttpClient,
    private hsShareService: HsShareService,
    private hsLaymanService: HsLaymanService,
    private hsLayoutService: HsLayoutService,
    private hsUtilsService: HsUtilsService,
    private hsEventBusService: HsEventBusService,
    private hsLogService: HsLogService,
  ) {
    super();
    this.hsEventBusService.compositionLoads.subscribe((data) => {
      if (data.error == undefined) {
        const responseData = data.data ?? data;
        this.currentComposition = responseData;

        this.compoData.patchValue({
          id: responseData.id,
          abstract: responseData.abstract,
          name: responseData.name,
          keywords: responseData.keywords,
          workspace: responseData.workspace,
          currentCompositionTitle: this.compoData.get('name').value,
        });
      }
    });

    this.hsEventBusService.mainPanelChanges.subscribe((which) => {
      if (
        this.hsLayoutService.mainpanel == 'saveMap' ||
        this.hsLayoutService.mainpanel == 'statusCreator'
      ) {
        this.hsMapService.loaded().then(() => {
          this.hsSaveMapService.generateThumbnail(
            this.hsLayoutService.contentWrapper.querySelector(
              '.hs-stc-thumbnail',
            ),
          );
        });
        this.hsEventBusService.mapResets.subscribe(() => {
          this.resetCompoData();
        });
      }
    });

    this.hsEventBusService.olMapLoads.subscribe((map) => {
      //this.setCurrentBoundingBox();
      map.on(
        'postcompose',
        this.hsUtilsService.debounce(
          () => {
            if (this.hsLayoutService.mainpanel == 'saveMap') {
              //this.setCurrentBoundingBox();
              this.hsSaveMapService.generateThumbnail(
                this.hsLayoutService.contentWrapper.querySelector(
                  '.hs-stc-thumbnail',
                ),
              );
            }
          },
          1000,
          false,
          this,
        ),
      );
    });
  }

  /**
   * Select the endpoint
   */
  selectEndpoint(endpoint: HsEndpoint): void {
    this.endpointSelected.next(endpoint);
  }

  /**
   * Update composition data object name
   */
  updateCompodataName(name: string) {
    this.compoData.controls.name.setValue(name);
  }

  /**
   * Save composition to external service database
   * @param saveAsNew - Save as new composition
   * @param endpoint - Endpoint's description
   * @returns Promise result of POST
   */
  save(saveAsNew: boolean, endpoint: HsEndpoint): Promise<any> {
    return new Promise((resolve, reject) => {
      const tempCompoData: CompoData = {};
      Object.assign(tempCompoData, this.compoData.value);
      // Check whether layers were already formatted
      // if (tempCompoData.layers[0].layer) {
      //   tempCompoData.layers = tempCompoData.layers.filter((l) => l.checked);
      // }
      const compositionJson = this.generateCompositionJson();
      let saver: HsSaverService = this.hsShareService;
      if (endpoint.type.includes('layman')) {
        saver = this.hsLaymanService;
      }
      saver
        .save(compositionJson, endpoint, tempCompoData, saveAsNew)
        .then((response) => {
          const compInfo: any = {};
          const j = response;
          let status = false;
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
          } else {
            this.hsEventBusService.compositionLoading.next(compInfo);
            this.hsEventBusService.compositionLoads.next(compInfo);
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
   * @param compoData - Additional data for composition
   * @returns composition JSON
   */
  generateCompositionJson(): MapComposition {
    return this.hsSaveMapService.map2json(
      this.hsMapService.getMap(),
      this.compoData.value,
      this.userData,
      this.statusData,
    );
  }

  /**
   * Initialization of Save map wizard from outside of component
   * @param composition - Composition selected from the compositions list
   */
  openPanel(composition): void {
    this.hsLayoutService.setMainPanel('saveMap', true);
    this.fillCompositionLayers();
    this.panelOpened.next({composition});
  }

  /**
   * Fill composition's layers from the OL map layers list
   */
  private fillCompositionLayers(): void {}

  /**
   * Process user's info into controller model, so they can be used in Save composition forms
   * @param response - HTTP response containing user data
   */
  setUserDetails(response): void {
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
        this.userData.postalCode = user.userInfo.org.zip;
        this.userData.city = user.userInfo.org.city;
        this.userData.organization = user.userInfo.org.name;
      }
    }
  }

  /**
   * Callback for saving with new name
   */
  selectNewName(): void {
    this.updateCompodataName(this.statusData.guessedTitle);
    this.changeTitle = true;
  }

  /**
   * Check if the composition's input form is valid
   * @returns True if the form is valid, false otherwise
   */
  validateForm(): boolean {
    this.missingName = !this.compoData.controls.name.value;
    this.missingAbstract = !this.compoData.controls.abstract.value;
    return (
      !!this.compoData.controls.name.value &&
      !!this.compoData.controls.abstract.value
    );
  }

  /**
   * Reset locally stored composition's input data to default values
   */
  resetCompoData(): void {
    this.compoData.patchValue({
      id: '',
      abstract: '',
      name: '',
      currentCompositionTitle: '',
      keywords: '',
    });
    this.currentComposition = '';
  }

  /**
   * Initiate composition's saving procedure
   * @param saveAsNew - If true save a new composition, otherwise overwrite to current one
   */
  async initiateSave(saveAsNew: boolean): Promise<void> {
    if (!this.compoData.valid) {
      this.hsLogService.log('validationfailed');
      return;
    }
    try {
      const augmentedResponse = await this.save(
        saveAsNew,
        this.endpointSelected.getValue(),
      );
      this.processSaveCallback(augmentedResponse);
    } catch (ex) {
      this.hsLogService.error(ex);
      this.processSaveCallback(ex);
    }
  }

  /**
   * Process response data after saving the composition
   * @param response - HTTP response after saving the composition
   */
  processSaveCallback(response): void {
    this.statusData.status = response.status;
    if (!response.status) {
      const error = response.error;
      if (error.code == 24) {
        this.statusData.overWriteNeeded = true;
        this.updateCompodataName(error.detail.mapname);
        this.statusData.resultCode = 'exists';
      } else if (error.code == 32) {
        this.statusData.resultCode = 'not-saved';
      } else {
        this.statusData.resultCode = 'error';
      }
      this.statusData.error = error;
    } else {
      this.statusData.resultCode = 'success';
      this.hsLayoutService.setMainPanel('layermanager', true);
    }
    this.saveMapResulted.next(this.statusData);
  }

  /**
   * Focus the browser to composition's title
   */
  focusTitle() {
    if (this.statusData.guessedTitle) {
      this.updateCompodataName(this.statusData.guessedTitle);
    }
    //TODO: Check if this works and input is focused
    this.hsLayoutService.contentWrapper.querySelector('.hs-stc-title').focus();
  }
}
