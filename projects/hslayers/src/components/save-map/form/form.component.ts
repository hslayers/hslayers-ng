import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCoreService} from '../../core/core.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {
  HsSaveMapManagerParams,
  HsSaveMapManagerService,
} from '../save-map-manager.service';
import {HsUtilsService} from '../../utils/utils.service';

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
  @Input() app = 'default';
  appRef: HsSaveMapManagerParams;

  private end = new Subject<void>();
  constructor(
    private hsSaveMapManagerService: HsSaveMapManagerService,
    private hsCoreService: HsCoreService,
    private hsUtilsService: HsUtilsService,
    private hsLayerUtilsService: HsLayerUtilsService, //Used in template
    private hsLayoutService: HsLayoutService
  ) {}

  ngOnInit(): void {
    this.appRef = this.hsSaveMapManagerService.get(this.app);
    this.appRef.endpointSelected
      .pipe(takeUntil(this.end))
      .subscribe((endpoint) => {
        this.endpoint = endpoint;
      });

    this.appRef.saveMapResulted
      .pipe(takeUntil(this.end))
      .subscribe(({statusData, app}) => {
        if (statusData.overWriteNeeded) {
          this.overwrite = true;
        }
        if (statusData == 'rename') {
          this.hsLayoutService
            .get(app)
            .layoutElement.querySelector('[name="hs-save-map-name"]')
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
      this.hsSaveMapManagerService.generateCompositionJson(this.app);
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
    this.appRef.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeselectClicked)
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
    this.appRef.missingName = false;
  }

  /**
   * Triggered when composition's abstract input field receives user's input
   */
  abstractChanged(): void {
    this.appRef.missingAbstract = false;
  }

  /**
   * Check if user is allowed to save the composition, based on the currently selected endpoint type
   * @returns True if endpoint type is 'layman'.
   * True if the endpoint type is 'statusmanager' and the user is authorized,
   * false otherwise
   */
  isAllowed(): boolean {
    if (this.endpoint === null) {
      return false;
    }
    if (this.endpoint.type == 'statusmanager') {
      return !this.hsCoreService.isAuthorized();
    } else if (this.endpoint.type == 'layman') {
      return true;
    }
  }

  /**
   * Initiate composition's saving procedure
   * @param newSave - If true save a new composition, otherwise overwrite to current one
   */
  initiateSave(newSave: boolean): void {
    this.hsSaveMapManagerService.initiateSave(newSave, this.app);
  }

  /**
   * Set bounding box property from the current OL map view
   */
  setCurrentBoundingBox(): void {
    this.hsSaveMapManagerService.setCurrentBoundingBox(this.app);
  }

  /**
   * Check if current user can overwrite the composition data
   */
  canOverwrite(): boolean {
    return (
      this.appRef.compoData.workspace &&
      this.appRef.currentUser !== this.appRef.compoData.workspace
    );
  }
}
