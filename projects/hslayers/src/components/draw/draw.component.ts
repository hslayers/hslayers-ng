import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject, takeUntil} from 'rxjs';

import {HsConfig, HsConfigObject} from '../../config.service';
import {HsDialogContainerService} from '../layout/public-api';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata/draw-layer-metadata.component';
import {HsDrawService} from './draw.service';
import {HsLanguageService} from './../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsQueryBaseService} from '../query/query-base.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-draw',
  templateUrl: './partials/draw.html',
})
export class HsDrawComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy {
  name = 'draw';
  selectedOption = 'draw';
  appRef;
  configRef: HsConfigObject;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    public HsDrawService: HsDrawService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService,
    public HsQueryBaseService: HsQueryBaseService,
    public hsUtilsService: HsUtilsService,
    public hsSidebarService: HsSidebarService,
    public HsDialogContainerService: HsDialogContainerService,
    private hsConfig: HsConfig
  ) {
    super(hsLayoutService);
  }
  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  ngOnInit(): void {
    this.appRef = this.HsDrawService.get(this.data.app);
    this.configRef = this.hsConfig.get(this.data.app);
    this.appRef.layerMetadataDialog
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.HsDialogContainerService.create(
          HsDrawLayerMetadataDialogComponent,
          {service: this.HsDrawService, app: this.data.app},
          this.data.app
        );
      });

    this.hsSidebarService.addButton(
      {
        panel: 'draw',
        module: 'hs.draw',
        order: 16,
        fits: true,
        title: 'PANEL_HEADER.DRAW',
        description: 'SIDEBAR.descriptions.DRAW',
        icon: 'icon-pencil',
      },
      this.data.app
    );
    this.HsDrawService.init(this.data.app);
  }

  componentOptionSelected(option) {
    this.selectedOption = option;
    if (this.selectedOption == 'edit') {
      this.HsDrawService.setType(this.appRef.type, this.data.app);
    }
  }
}
