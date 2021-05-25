import {Component, OnDestroy} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsStylerService} from '../styles/styler.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-styles',
  templateUrl: './partials/styler.html',
})
export class HsStylerComponent implements OnDestroy {
  layerTitle: string;
  level: 'cluster' | 'layer' = 'layer';
  isClustered: boolean;
  private ngUnsubscribe = new Subject();
  constructor(
    public HsStylerService: HsStylerService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsUtilsService: HsUtilsService,
    public HsSaveMapService: HsSaveMapService
  ) {
    this.HsEventBusService.layerSelectedFromUrl
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((layer) => {
        if (layer !== null) {
          this.HsStylerService.fill(layer);
        }
      });
    this.HsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        if (e == 'styler') {
          this.HsStylerService.fill(this.HsStylerService.layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  layermanager(): void {
    this.HsLayoutService.setMainPanel('layermanager');
  }
}
