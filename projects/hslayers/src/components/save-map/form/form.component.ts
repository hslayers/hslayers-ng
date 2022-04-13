import {Component, Input, OnDestroy, OnInit} from '@angular/core';

import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsCoreService} from '../../core/core.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsSaveMapManagerService} from '../feature-services/save-map-manager.service';
import {HsUtilsService} from '../../utils/utils.service';

@Component({
  selector: 'hs-save-map-form',
  templateUrl: './form.component.html',
})
export class HsSaveMapAdvancedFormComponent implements OnDestroy, OnInit {
  btnSelectDeselectClicked = true;
  endpoint: any;
  overwrite = false;
  downloadableData: string;
  extraFormOpened = '';
  @Input() app = 'default';
  appRef;

  private ngUnsubscribe = new Subject<void>();
  constructor(
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public HsCoreService: HsCoreService,
    public HsUtilsService: HsUtilsService,
    public HsLayerUtilsService: HsLayerUtilsService, //Used in template
    public HsLayoutService: HsLayoutService
  ) {}

  ngOnInit() {
    this.appRef = this.HsSaveMapManagerService.get(this.app);
    this.appRef.endpointSelected
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((endpoint) => {
        this.endpoint = endpoint;
      });

    this.appRef.saveMapResulted
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({statusData, app}) => {
        if (statusData.overWriteNeeded) {
          this.overwrite = true;
        }
        if (statusData == 'rename') {
          this.HsLayoutService.get(app)
            .layoutElement.querySelector('[name="hs-save-map-name"]')
            .focus();
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
      this.HsSaveMapManagerService.generateCompositionJson(this.app);
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
    this.appRef.compoData.layers.forEach(
      (layer) => (layer.checked = this.btnSelectDeselectClicked)
    );
  }

  //*NOTE not being used
  capitalizeFirstLetter(string: string): string {
    return this.HsUtilsService.capitalizeFirstLetter(string);
  }

  titleChanged(): void {
    this.overwrite = false;
    this.appRef.missingTitle = false;
    this.appRef.missingName = false;
  }

  abstractChanged(): void {
    this.appRef.missingAbstract = false;
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
