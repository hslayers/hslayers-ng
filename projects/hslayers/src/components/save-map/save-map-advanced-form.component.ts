import {Component, OnDestroy} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
import {HsUtilsService} from './../utils/utils.service';
@Component({
  selector: 'hs-save-map-advanced-form',
  templateUrl: './partials/form.html',
})
export class HsSaveMapAdvancedFormComponent implements OnDestroy {
  btnSelectDeselectClicked = true;
  step = 'context';
  steps = ['context', 'access', 'author'];
  endpoint: any;
  overwrite = false;
  downloadableData: string;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsEventBusService: HsEventBusService,
    public HsCoreService: HsCoreService,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {
    this.HsEventBusService.mapResets
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.step = 'context';
      });

    this.HsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((which: string) => {
        if (which == 'saveMap') {
          this.step = 'context';
        }
      });

    this.HsSaveMapManagerService.endpointSelected
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((endpoint) => {
        this.endpoint = endpoint;
        switch (endpoint?.type) {
          case 'layman':
            this.steps = ['context', 'author'];
            break;
          default:
            this.steps = ['context', 'access', 'author'];
        }
      });

    this.HsSaveMapManagerService.saveMapResulted
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((statusData) => {
        if (statusData.status || statusData == 'rename') {
          this.step = 'context';
        }
        if (statusData.overWriteNeeded) {
          this.overwrite = true;
        }
      });
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
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

  selectDeselectAllLayers() {
    this.btnSelectDeselectClicked = !this.btnSelectDeselectClicked;
    this.HsSaveMapManagerService.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeselectClicked)
    );
  }

  /**
   * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
   */
  next() {
    const ixCurrent = this.steps.indexOf(this.step);
    if (this.steps.length > ixCurrent + 1) {
      this.step = this.steps[ixCurrent + 1];
    } else {
      this.step = 'end';
    }
  }

  setStep(step) {
    this.step = step;
  }
  capitalizeFirstLetter(string: string): string {
    return this.HsUtilsService.capitalizeFirstLetter(string);
  }
  titleChanged() {
    this.overwrite = false;
  }

  isAllowed() {
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
