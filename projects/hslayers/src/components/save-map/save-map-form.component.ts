import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCoreService} from '../core/core.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-save-map-form',
  templateUrl: './partials/form.html',
})
export class HsSaveMapAdvancedFormComponent implements OnDestroy {
  btnSelectDeselectClicked = true;
  endpoint: any;
  overwrite = false;
  downloadableData: string;
  extraFormOpened = '';
  private ngUnsubscribe = new Subject<void>();
  constructor(
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsCoreService: HsCoreService,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {
    this.HsSaveMapManagerService.endpointSelected
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((endpoint) => {
        this.endpoint = endpoint;
      });

    this.HsSaveMapManagerService.saveMapResulted
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((statusData) => {
        if (statusData.overWriteNeeded) {
          this.overwrite = true;
        }
        if (statusData == 'rename') {
          document.getElementsByName('hs-save-map-name')[0].focus();
        }
      });
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  setExtraFormTo(form: string): void {
    if (this.extraFormOpened === form) {
      this.extraFormOpened = '';
    } else {
      this.extraFormOpened = form;
    }
  }

  saveCompoJson(): void {
    const compositionJSON =
      this.HsSaveMapManagerService.generateCompositionJson();
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

  selectDeselectAllLayers(): void {
    this.btnSelectDeselectClicked = !this.btnSelectDeselectClicked;
    this.HsSaveMapManagerService.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeselectClicked)
    );
  }

  //*NOTE not being used
  capitalizeFirstLetter(string: string): string {
    return this.HsUtilsService.capitalizeFirstLetter(string);
  }

  titleChanged(): void {
    this.overwrite = false;
    this.HsSaveMapManagerService.missingTitle = false;
    this.HsSaveMapManagerService.missingName = false;
  }

  abstractChanged(): void {
    this.HsSaveMapManagerService.missingAbstract = false;
  }

  isAllowed(): boolean {
    if (this.endpoint === null) {
      return false;
    }
    if (this.endpoint.type == 'statusmanager') {
      return !this.HsCoreService.isAuthorized();
    } else if (this.endpoint.type == 'layman') {
      return true;
    }
  }
}
