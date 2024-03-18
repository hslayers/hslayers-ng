import {BehaviorSubject, Subject, withLatestFrom} from 'rxjs';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {AccessRightsModel} from 'hslayers-ng/types';
import {CompoData} from 'hslayers-ng/types';
import {HsCompositionsParserService} from 'hslayers-ng/shared/compositions';
import {HsConfig} from 'hslayers-ng/config';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsMapService} from 'hslayers-ng/shared/map';
import {HsSaveMapService} from 'hslayers-ng/shared/save-map';
import {HsSaverService} from 'hslayers-ng/shared/save-map';
import {HsShareService} from 'hslayers-ng/components/share';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {LaymanCompositionDescriptor} from 'hslayers-ng/types';
import {MapComposition} from 'hslayers-ng/types';
import {StatusData} from 'hslayers-ng/types';
import {UserData} from 'hslayers-ng/types';

export class HsSaveMapManagerParams {
  statusData: StatusData = {
    titleFree: undefined,
    hasPermission: undefined,
    success: undefined,
    changeTitle: undefined,
    groups: [],
  };

  currentComposition = undefined;

  _access_rights: AccessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };

  compoData = new FormGroup({
    name: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    abstract: new FormControl('', {
      validators: Validators.required,
      nonNullable: true,
    }),
    workspace: new FormControl(undefined), //{value: undefined, disabled: true}
    keywords: new FormControl(''),

    id: new FormControl(''),
    thumbnail: new FormControl(undefined),
    access_rights: new FormControl<AccessRightsModel>(this._access_rights),
  });

  userData: UserData = {};
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
    private hsCompositionsParserService: HsCompositionsParserService,
  ) {
    super();

    this.hsCompositionsParserService.currentCompositionRecord
      .pipe(withLatestFrom(this.hsEventBusService.compositionLoads))
      .subscribe(([metadata, composition]) => {
        if (composition.error == undefined) {
          const responseData = composition.data ?? composition;
          this.currentComposition = responseData;

          const workspace = metadata['error']
            ? this.currentUser
            : this.parseAccessRights(metadata);

          this.compoData.patchValue({
            id: responseData.id,
            abstract: responseData.abstract,
            keywords: responseData.keywords,
            workspace: workspace,
            //NOTE: Keep name last so its valueChange subscription has access to updated values
            name: responseData.name,
            access_rights: this._access_rights,
          });
        }
      });

    this.hsLayoutService.mainpanel$.subscribe((which) => {
      if (
        this.hsLayoutService.mainpanel == 'saveMap' ||
        this.hsLayoutService.mainpanel == 'statusCreator'
      ) {
        this.hsEventBusService.mapResets.subscribe(() => {
          this.resetCompoData();
        });
      }
    });
  }

  parseAccessRights(metadata: LaymanCompositionDescriptor): string {
    this.currentComposition.editable = true;
    const workspace = metadata.url.match(/\/workspaces\/([^/]+)/)
      ? metadata.url.match(/\/workspaces\/([^/]+)/)[1]
      : null;
    const write = metadata.access_rights.write;
    const read = metadata.access_rights.read;
    if (this.currentUser === workspace) {
      this.privateOrPublic(write, 'write', this.currentUser);
      this.privateOrPublic(read, 'read', this.currentUser);
    } else if (
      write.includes(this.currentUser) ||
      /**
       * Different user + PUBLIC write
       */
      (write.length == 2 &&
        [workspace, 'EVERYONE'].every((u) => write.includes(u)))
    ) {
      this.privateOrPublic(write, 'write', workspace);
      this.privateOrPublic(read, 'read', workspace);
    } else {
      /**
       * Not editable composition. Saved composition will have its own access rights
       * No need to copy existing
       */
      this._access_rights[`access_rights.read`] = 'EVERYONE';
      this._access_rights[`access_rights.write`] = 'private';
      this.currentComposition.editable = false;
    }

    return workspace;
  }

  /**
   * Transform access rights array received from Layman to simplified version used in HSL
   * Map access string (read or write) to EVERYONE, private or keep original.
   */
  private privateOrPublic(
    access: string[],
    type: 'write' | 'read',
    user: string,
  ): void {
    const filtered = access.filter((u) => u !== user);
    this._access_rights[`access_rights.${type}`] =
      filtered.length === 0
        ? 'private'
        : filtered.length === 1 && filtered[0] === 'EVERYONE'
          ? filtered[0]
          : access.join(',');
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
  updateCompoDataName(name: string) {
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
    this.panelOpened.next({composition});
  }

  /**
   * Process user's info into controller model, so they can be used in Save composition forms
   * @param response - HTTP response containing user data
   */
  setUserDetails(response): void {
    const user = response.data;
    if (user && user.success == true) {
      // set the values
      if (user.userInfo) {
        this.userData.contact.email = user.userInfo.email;
        this.userData.contact.phone = user.userInfo.phone;
        this.userData.contact.person =
          user.userInfo.firstName + ' ' + user.userInfo.lastName;
      }
      if (user.userInfo && user.userInfo.org) {
        this.userData.organization.address = user.userInfo.org.street;
        this.userData.organization.country = user.userInfo.org.state;
        this.userData.organization.postalCode = user.userInfo.org.zip;
        this.userData.organization.city = user.userInfo.org.city;
        this.userData.organization.name = user.userInfo.org.name;
      }
    }
  }

  /**
   * Callback for saving with new name
   */
  selectNewName(): void {
    this.updateCompoDataName(this.statusData.guessedTitle);
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
      keywords: '',
    });
    this.currentComposition = undefined;
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
        this.updateCompoDataName(error.detail.mapname);
        this.statusData.resultCode = 'exists';
      } else if (error.code == 32) {
        this.statusData.resultCode = 'not-saved';
      } else {
        this.statusData.resultCode = 'error';
      }
      this.statusData.error = error;
    } else {
      this.statusData.resultCode = 'success';
      this.hsLayoutService.setMainPanel('layerManager', true);
    }
    this.saveMapResulted.next(this.statusData);
  }

  /**
   * Focus the browser to composition's title
   */
  focusTitle() {
    if (this.statusData.guessedTitle) {
      this.updateCompoDataName(this.statusData.guessedTitle);
    }
    //TODO: Check if this works and input is focused
    this.hsLayoutService.contentWrapper.querySelector('.hs-stc-title').focus();
  }
}
