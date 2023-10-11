import {Component, OnDestroy, OnInit} from '@angular/core';

import {Observable, Subject, map, startWith, takeUntil} from 'rxjs';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsSaveMapManagerService} from '../save-map-manager.service';
import {HsUtilsService} from '../../utils/utils.service';
import {StatusData} from '../../save-map/types/status-data.type';
import {accessRightsModel} from '../../add-data/common/access-rights.model';

@Component({
  selector: 'hs-save-map-form',
  templateUrl: './form.component.html',
})
export class HsSaveMapAdvancedFormComponent implements OnDestroy, OnInit {
  endpoint: HsEndpoint;
  overwrite = false;
  downloadableData: string;
  extraFormOpened = '';

  isVisible: Observable<boolean>;

  private end = new Subject<void>();

  _access_rights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };

  constructor(
    public hsSaveMapManagerService: HsSaveMapManagerService,
    private hsUtilsService: HsUtilsService,
    private hsLayoutService: HsLayoutService,
    private hsEventBusService: HsEventBusService,
  ) {
    this.isVisible = this.hsEventBusService.mainPanelChanges.pipe(
      startWith(this.hsLayoutService.mainpanel),
      map((panel) => {
        return panel === 'saveMap';
      }),
    );
  }

  ngOnInit(): void {
    this.hsSaveMapManagerService.endpointSelected
      .pipe(takeUntil(this.end))
      .subscribe((endpoint) => {
        this.endpoint = endpoint;
      });

    this.hsSaveMapManagerService.saveMapResulted
      .pipe(takeUntil(this.end))
      .subscribe((statusData) => {
        if ((statusData as StatusData).overWriteNeeded) {
          this.overwrite = true;
        }
        if (statusData == 'rename') {
          this.hsLayoutService.layoutElement
            .querySelector('[name="hs-save-map-name"]')
            .focus();
        }
      });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  /**
   * Set extra form that will get opened
   * @param form - Form name that needs to be opened
   */
  setExtraFormTo(form: string): void {
    if (this.extraFormOpened === form) {
      this.extraFormOpened = '';
    } else {
      this.extraFormOpened = form;
    }
  }

  /**
   * Manually set access rights on form as component itself is not compatible with reactive forms
   */
  setAccessRights(data: accessRightsModel) {
    this.hsSaveMapManagerService.compoData.patchValue({
      access_rights: data,
    });
  }

  /**
   * Save map composition as json file
   */
  saveCompoJson(): void {
    const compositionJSON =
      this.hsSaveMapManagerService.generateCompositionJson();
    const file = new Blob([JSON.stringify(compositionJSON)], {
      type: 'application/json',
    });

    const a = <HTMLAnchorElement>document.getElementById('stc-download'),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = 'composition';
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  /**
   * Set the first string letter to an uppercase
   * NOTE not being used
   * @returns Returns the same string, but with a capitalized first letter
   */
  capitalizeFirstLetter(string: string): string {
    return this.hsUtilsService.capitalizeFirstLetter(string);
  }

  /**
   * Triggered when composition's title input field receives user's input
   */
  nameChanged(): void {
    this.overwrite = false;
    this.hsSaveMapManagerService.missingName = false;
  }

  /**
   * Triggered when composition's abstract input field receives user's input
   */
  abstractChanged(): void {
    this.hsSaveMapManagerService.missingAbstract = false;
  }

  /**
   * Check if user is allowed to save the composition, based on the currently selected endpoint type
   * @returns True if endpoint type is 'layman'.
   */
  isAllowed(): boolean {
    if (this.endpoint === null) {
      return false;
    }
    if (this.endpoint.type.includes('layman')) {
      return true;
    }
  }

  /**
   * Initiate composition's saving procedure
   * @param newSave - If true save a new composition, otherwise overwrite to current one
   */
  initiateSave(newSave: boolean): void {
    this.hsSaveMapManagerService.initiateSave(newSave);
  }

  /**
   * Check if current user can overwrite the composition data
   */
  canOverwrite(): boolean {
    const workspace =
      this.hsSaveMapManagerService.compoData.controls.workspace.value;
    return workspace && this.hsSaveMapManagerService.currentUser !== workspace;
  }
}
