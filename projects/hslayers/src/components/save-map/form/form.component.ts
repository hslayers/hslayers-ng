import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject, takeUntil} from 'rxjs';

import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLayoutService} from '../../layout/layout.service';
import {HsSaveMapManagerService} from '../save-map-manager.service';
import {HsUtilsService} from '../../utils/utils.service';
import {StatusData} from '../../save-map/types/status-data.type';

@Component({
  selector: 'hs-save-map-form',
  templateUrl: './form.component.html',
})
export class HsSaveMapAdvancedFormComponent implements OnDestroy, OnInit {
  btnSelectDeselectClicked = true;
  endpoint: HsEndpoint;
  overwrite = false;
  downloadableData: string;
  extraFormOpened = '';
  private end = new Subject<void>();

  constructor(
    public hsSaveMapManagerService: HsSaveMapManagerService,
    private hsUtilsService: HsUtilsService,
    private hsLayoutService: HsLayoutService,
  ) {}

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
   * Select or deselect all available composition's layers
   */
  selectDeselectAllLayers(): void {
    this.btnSelectDeselectClicked = !this.btnSelectDeselectClicked;
    this.hsSaveMapManagerService.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeselectClicked),
    );
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
   * Set bounding box property from the current OL map view
   */
  setCurrentBoundingBox(): void {
    this.hsSaveMapManagerService.setCurrentBoundingBox();
  }

  /**
   * Check if current user can overwrite the composition data
   */
  canOverwrite(): boolean {
    return (
      this.hsSaveMapManagerService.compoData.workspace &&
      this.hsSaveMapManagerService.currentUser !==
        this.hsSaveMapManagerService.compoData.workspace
    );
  }
}
