import {Component, OnDestroy, OnInit} from '@angular/core';

import {BehaviorSubject, Subject, takeUntil} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
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
  templateUrl: './draw.component.html',
})
export class HsDrawComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy
{
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

    this.selectedOption.pipe(takeUntil(this.end)).subscribe((option) => {
      if (option == 'edit') {
        this.HsDrawService.setType(this.HsDrawService.type);
      }
    });
  }
}
