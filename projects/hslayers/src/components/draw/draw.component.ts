import {Component, OnInit} from '@angular/core';

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
export class HsDrawComponent extends HsPanelBaseComponent implements OnInit {
  name = 'draw';
  selectedOption = 'draw';

  constructor(
    public HsDrawService: HsDrawService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService,
    public HsQueryBaseService: HsQueryBaseService,
    public hsUtilsService: HsUtilsService,
    public hsSidebarService: HsSidebarService,
    HsDialogContainerService: HsDialogContainerService
  ) {
    super(hsLayoutService);
    this.HsDrawService.layerMetadataDialog.subscribe(() => {
      HsDialogContainerService.create(
        HsDrawLayerMetadataDialogComponent,
        this.HsDrawService,
        this.data.app
      );
    });
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton(
      {
        panel: 'draw',
        module: 'hs.draw',
        order: 16,
        fits: true,
        title: () => this.HsLanguageService.getTranslation('PANEL_HEADER.DRAW'),
        description: () =>
          this.HsLanguageService.getTranslation('SIDEBAR.descriptions.DRAW'),
        icon: 'icon-pencil',
      },
      this.data.app
    );
    this.HsDrawService.init(this.data.app);
  }

  componentOptionSelected(option) {
    this.selectedOption = option;
    if (this.selectedOption == 'edit') {
      this.HsDrawService.setType(this.HsDrawService.type, this.data.app);
    }
  }
}
