import {Component} from '@angular/core';
import {HsCoreService} from '../core/core.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsSaveMapManagerService} from './save-map-manager.service';
@Component({
  selector: 'hs-save-map-advanced-form',
  template: require('./partials/form.html'),
})
export class HsSaveMapAdvancedFormComponent {
  btnSelectDeselectClicked = true;
  step = 'context';
  steps = ['context', 'access', 'author'];
  endpoint: any;
  overwrite = false;
  downloadableData: string;
  changeTitle: boolean;

  constructor(
    private HsSaveMapManagerService: HsSaveMapManagerService,
    private HsEventBusService: HsEventBusService,
    private HsCoreService: HsCoreService
  ) {
    this.HsEventBusService.mapResets.subscribe(() => {
      this.step = 'context';
    });

    this.HsEventBusService.mainPanelChanges.subscribe((which: string) => {
      if (which == 'saveMap') {
        this.step = 'context';
      }
    });

    this.HsSaveMapManagerService.endpointSelected.subscribe((endpoint) => {
      this.endpoint = endpoint;
      switch (endpoint.type) {
        case 'layman':
          this.steps = ['context', 'author'];
          break;
        default:
          this.steps = ['context', 'access', 'author'];
      }
    });

    this.HsSaveMapManagerService.saveMapResulted.subscribe((statusData) => {
      if (statusData.status) {
        this.step = 'context';
      }
      if (statusData.overWriteNeeded) {
        this.overwrite = true;
      }
    });
  }

  selectDeselectAllLayers() {
    this.btnSelectDeselectClicked = !this.btnSelectDeselectClicked;
    this.HsSaveMapManagerService.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeselectClicked)
    );
  }

  /**
   * Callback function for clicking Next button, create download link for map context and show save, saveas buttons
   *
   * @function next
   * @memberof hs.save-map
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

  titleChanged() {
    this.overwrite = false;
  }

  /**
   * Callback for saving with new title
   *
   * @function selectNewTitle
   * @memberof hs.save-map
   */
  selectNewTitle() {
    this.HsSaveMapManagerService.compoData.title = this.HsSaveMapManagerService.statusData.guessedTitle;
    this.changeTitle = true;
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
