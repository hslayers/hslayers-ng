import {
  filter,
  map,
  Subject,
  tap,
  withLatestFrom,
  merge,
  lastValueFrom,
} from 'rxjs';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {HttpClient} from '@angular/common/http';
import {Injectable, signal, Signal, WritableSignal} from '@angular/core';

import {
  AccessRightsModel,
  CompoData,
  HsEndpoint,
  LaymanCompositionDescriptor,
  MapComposition,
  StatusData,
  UserData,
} from 'hslayers-ng/types';
import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {
  HsLaymanService,
  HsSaveMapService,
  HsSaverService,
} from 'hslayers-ng/services/save-map';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsShareService} from 'hslayers-ng/components/share';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {toSignal} from '@angular/core/rxjs-interop';
import {HsToastService} from 'hslayers-ng/common/toast';

export class HsSaveMapManagerParams {
  statusData: StatusData = {
    success: undefined,
    canEditExistingComposition: undefined,
  };

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
    workspace: new FormControl<string | undefined>(undefined), //{value: undefined, disabled: true}
    keywords: new FormControl(''),

    id: new FormControl(''),
    thumbnail: new FormControl(undefined),
    access_rights: new FormControl<AccessRightsModel>(this._access_rights),
  });

  userData: UserData = {};
  panelOpened: Subject<any> = new Subject();
  saveMapResulted: Subject<StatusData | string> = new Subject();
  preSaveCheckCompleted: Subject<HsEndpoint> = new Subject();
  currentUser: Signal<string>;
  missingAbstract = false;

  constructor() {}
}

@Injectable({
  providedIn: 'root',
})
export class HsSaveMapManagerService extends HsSaveMapManagerParams {
  currentUser = this.hsCommonLaymanService.user;

  private mapResets = this.hsEventBusService.mapResets.pipe(
    filter(() => {
      return (
        this.hsLayoutService.mainpanel == 'saveMap' ||
        this.hsLayoutService.mainpanel == 'statusCreator'
      );
    }),
    tap(() => this.resetCompoData()),
    map(() => undefined),
  );

  private _currentComposition = merge(
    //Undefined...
    this.mapResets,
    //..or result of omposition loaded
    this.hsCompositionsParserService.currentCompositionRecord.pipe(
      withLatestFrom(this.hsEventBusService.compositionLoads),
      filter(([metadata, composition]) => {
        return composition.error == undefined;
      }),
      map(([metadata, composition]) => {
        const compositionData = composition.data ?? composition;
        return [metadata, compositionData];
      }),
      tap(([metadata, compositionData]) => {
        const workspace = metadata['error']
          ? this.currentUser()
          : this.parseAccessRights(metadata);

        this.compoData.patchValue({
          id: compositionData.id,
          abstract: compositionData.abstract,
          keywords: compositionData.keywords,
          workspace: workspace,
          //NOTE: Keep name last so its valueChange subscription has access to updated values
          name: compositionData.name,
          access_rights: this._access_rights,
        });
      }),
      map(([metadata, compositionData]) => {
        return compositionData;
      }),
    ),
  );

  currentComposition = toSignal(this._currentComposition, {
    initialValue: undefined,
  });

  currentCompositionEditable: WritableSignal<boolean> = signal(false);

  constructor(
    private hsMapService: HsMapService,
    private hsSaveMapService: HsSaveMapService,
    private http: HttpClient,
    private hsShareService: HsShareService,
    private hsLaymanService: HsLaymanService,
    private hsLayoutService: HsLayoutService,
    private hsEventBusService: HsEventBusService,
    private hsLogService: HsLogService,
    private hsCompositionsParserService: HsCompositionsParserService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsToastService: HsToastService,
  ) {
    super();
  }

  parseAccessRights(metadata: LaymanCompositionDescriptor): string {
    this.currentCompositionEditable.set(true);
    const workspace = metadata.url.match(/\/workspaces\/([^/]+)/)
      ? metadata.url.match(/\/workspaces\/([^/]+)/)[1]
      : null;
    const write = metadata.access_rights.write;
    const read = metadata.access_rights.read;
    if (this.currentUser() === workspace) {
      this.privateOrPublic(write, 'write', this.currentUser());
      this.privateOrPublic(read, 'read', this.currentUser());
    } else if (
      write.includes(this.currentUser()) ||
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
      this.currentCompositionEditable.set(false);
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
        .save(compositionJson, tempCompoData, saveAsNew)
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
   * Reset locally stored composition's input data to default values
   */
  resetCompoData(): void {
    this.compoData.patchValue({
      id: '',
      abstract: '',
      name: '',
      keywords: '',
    });
  }

  /**
   * Initiate composition's saving procedure
   * @param saveAsNew - If true save a new composition, otherwise overwrite to current one
   */
  async initiateSave(saveAsNew: boolean): Promise<StatusData> {
    if (!this.compoData.valid) {
      this.hsLogService.log('validationfailed');
      return;
    }
    try {
      const augmentedResponse = await this.save(
        saveAsNew,
        this.hsCommonLaymanService.layman(),
      );
      return this.processSaveCallback(augmentedResponse);
    } catch (ex) {
      this.hsLogService.error(ex);
      return this.processSaveCallback(ex);
    }
  }

  /**
   * Process response data after saving the composition and display results using toasts
   * @param response - HTTP response after saving the composition
   * @returns The StatusData object reflecting the outcome
   */
  async processSaveCallback(response): Promise<StatusData> {
    this.statusData.status = response.status;
    this.statusData.error = undefined; // Reset error
    this.statusData.resultCode = undefined; // Reset result code
    this.statusData.overWriteNeeded = false; // Reset overwrite flag
    this.statusData.canEditExistingComposition = undefined;

    if (!response.status) {
      const error = response.error;
      this.statusData.error = error;
      const errorHeader = 'Error saving composition';
      const errorDetails = error?.['message'] ? [error['message']] : undefined;
      const reason = error.detail?.reason;
      let errorText = 'Could not save composition.'; // Default error text

      if (error?.code === 24) {
        this.statusData.overWriteNeeded = true;
        this.updateCompoDataName(error.detail.mapname);
        this.statusData.resultCode = 'exists';
        this.hsToastService.show(
          `Composition '${error.detail.mapname}' already exists. Please choose a different name or overwrite.`,
          {
            header: 'Composition exists',
            type: 'warning',
            autohide: false, // Keep this visible
            details: errorDetails,
          },
        );
        this.statusData.canEditExistingComposition =
          await this.canEditExistingComposition(error.detail.mapname);
      } else if (error?.code === 32) {
        this.statusData.resultCode = 'not-saved';
        errorText = 'Request was processed, but composition was not saved.';
        this.hsToastService.show(errorText, {
          header: 'Composition not saved',
          type: 'warning',
          details: errorDetails,
        });
      } else {
        this.statusData.resultCode = 'error';
        // Use generic error text unless specific message exists
        errorText = error?.['message'] ?? errorText;
        this.hsToastService.show(errorText, {
          header: errorHeader,
          type: 'danger',
          details: [reason],
        });
      }
    } else {
      this.statusData.resultCode = 'success';
      this.hsToastService.show(
        `Composition '${this.compoData.controls.name.value}' was saved.`,
        {
          header: 'Composition saved successfully',
          type: 'success',
        },
      );
      this.hsLayoutService.setMainPanel('layerManager', true);
    }
    return this.statusData;
  }

  /**
   * Check if the current user has write access to the composition
   */
  async canEditExistingComposition(compositionName: string): Promise<boolean> {
    try {
      const layman = this.hsCommonLaymanService.layman();
      const url = `${layman.url}/rest/maps?full_text_filter=${compositionName}`;
      const response = await lastValueFrom(
        this.http.get<any>(url, {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }),
      );
      const write = response[0].access_rights.write;
      const user = this.currentUser();
      return write.includes(user) || write.includes('EVERYONE');
    } catch (error) {
      console.error('Error checking if composition can be edited:', error);
      return false;
    }
  }
}
