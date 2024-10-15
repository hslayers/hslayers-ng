import {AsyncPipe, NgClass} from '@angular/common';
import {BehaviorSubject} from 'rxjs';
import {Component, OnInit} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {
  HsPanelBaseComponent,
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsQueryModule} from 'hslayers-ng/components/query';
import {TranslateCustomPipe} from 'hslayers-ng/services/language';

import {HsDrawEditComponent} from './draw-edit/draw-edit.component';
import {HsDrawPanelComponent} from './draw-panel/draw-panel.component';

@Component({
  selector: 'hs-draw',
  templateUrl: './draw.component.html',
  standalone: true,
  imports: [
    NgClass,
    AsyncPipe,
    TranslateCustomPipe,
    HsDrawEditComponent,
    HsDrawPanelComponent,
    HsPanelBaseComponent,
    HsQueryModule,
    HsPanelHeaderComponent,
    HsPanelHelpersModule,
  ],
})
export class HsDrawComponent extends HsPanelBaseComponent implements OnInit {
  name = 'draw';
  selectedOption = new BehaviorSubject('draw');
  constructor(
    public HsDrawService: HsDrawService,
    public HsDialogContainerService: HsDialogContainerService,
  ) {
    super();
  }

  ngOnInit(): void {
    this.HsDrawService.layerMetadataDialog
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        const {HsDrawLayerMetadataDialogComponent} = await import(
          './draw-layer-metadata/draw-layer-metadata.component'
        );
        this.HsDialogContainerService.create(
          HsDrawLayerMetadataDialogComponent,
          {service: this.HsDrawService},
        );
      });
    super.ngOnInit();
    this.selectedOption
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((option) => {
        if (option == 'edit') {
          this.HsDrawService.setType(this.HsDrawService.type);
        }
      });
  }
}
