import {Component, OnDestroy, OnInit} from '@angular/core';

import {BehaviorSubject, Subject, takeUntil} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata/draw-layer-metadata.component';

import {HsDrawService} from 'hslayers-ng/shared/draw';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsQueryBaseService} from 'hslayers-ng/shared/query';
import {HsSidebarService} from 'hslayers-ng/shared/sidebar';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

@Component({
  selector: 'hs-draw',
  templateUrl: './draw.component.html',
})
export class HsDrawComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy {
  name = 'draw';
  selectedOption = new BehaviorSubject('draw');
  private end = new Subject<void>();
  constructor(
    public HsDrawService: HsDrawService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService,
    public HsQueryBaseService: HsQueryBaseService,
    public hsUtilsService: HsUtilsService,
    public hsSidebarService: HsSidebarService,
    public HsDialogContainerService: HsDialogContainerService,
    private hsConfig: HsConfig,
  ) {
    super(hsLayoutService);
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.HsDrawService.layerMetadataDialog
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.HsDialogContainerService.create(
          HsDrawLayerMetadataDialogComponent,
          {service: this.HsDrawService},
        );
      });
    super.ngOnInit();
    this.selectedOption.pipe(takeUntil(this.end)).subscribe((option) => {
      if (option == 'edit') {
        this.HsDrawService.setType(this.HsDrawService.type);
      }
    });
  }
}
