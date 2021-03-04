import {Component, OnDestroy} from '@angular/core';

import {Subscription} from 'rxjs';

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
  subscriptions: Subscription[] = [];
  constructor(
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsEventBusService: HsEventBusService,
    public HsCoreService: HsCoreService,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService //Used in template
  ) {
    this.subscriptions.push(
      this.HsEventBusService.mapResets.subscribe(() => {
        this.step = 'context';
      })
    );

    this.subscriptions.push(
      this.HsEventBusService.mainPanelChanges.subscribe((which: string) => {
        if (which == 'saveMap') {
          this.step = 'context';
        }
      })
    );

    this.subscriptions.push(
      this.HsSaveMapManagerService.endpointSelected.subscribe((endpoint) => {
        this.endpoint = endpoint;
        switch (endpoint?.type) {
          case 'layman':
            this.steps = ['context', 'author'];
            break;
          default:
            this.steps = ['context', 'access', 'author'];
        }
      })
    );

    this.subscriptions.push(
      this.HsSaveMapManagerService.saveMapResulted.subscribe((statusData) => {
        if (statusData.status) {
          this.step = 'context';
        }
        if (statusData.overWriteNeeded) {
          this.overwrite = true;
        }
      })
    );
  }
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  selectDeselectAllLayers(): void {
    this.btnSelectDeselectClicked = !this.btnSelectDeselectClicked;
    this.HsSaveMapManagerService.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeselectClicked)
    );
  }

  /**
   * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
   *
   * @function next
   */
  next() {
    const ixCurrent = this.steps.indexOf(this.step);
    if (this.steps.length > ixCurrent + 1) {
      this.step = this.steps[ixCurrent + 1];
    } else {
      this.step = 'end';
      this.downloadableData =
        'text/json;charset=utf-8,' +
        encodeURIComponent(
          JSON.stringify(this.HsSaveMapManagerService.generateCompositionJson())
        );
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
