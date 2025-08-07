import {AsyncPipe, NgClass} from '@angular/common';
import {BehaviorSubject} from 'rxjs';
import {Component, OnInit, inject} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {TranslatePipe} from '@ngx-translate/core';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {
  HsPanelBaseComponent,
  HsPanelHeaderComponent,
  HsPanelHelpersModule,
} from 'hslayers-ng/common/panels';
import {HsQueryFeatureListComponent} from 'hslayers-ng/components/query';
import {HsDrawEditComponent} from './draw-edit/draw-edit.component';
import {HsDrawPanelComponent} from './draw-panel/draw-panel.component';

@Component({
  selector: 'hs-draw',
  templateUrl: './draw.component.html',
  imports: [
    NgClass,
    AsyncPipe,
    TranslatePipe,
    HsDrawEditComponent,
    HsDrawPanelComponent,
    HsQueryFeatureListComponent,
    HsPanelHeaderComponent,
    HsPanelHelpersModule,
  ],
})
export class HsDrawComponent extends HsPanelBaseComponent implements OnInit {
  hsDrawService = inject(HsDrawService);
  hsDialogContainerService = inject(HsDialogContainerService);

  name = 'draw';
  selectedOption = new BehaviorSubject('draw');

  ngOnInit(): void {
    this.hsDrawService.layerMetadataDialog
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async () => {
        const {HsDrawLayerMetadataDialogComponent} = await import(
          './draw-layer-metadata/draw-layer-metadata.component'
        );
        this.hsDialogContainerService.create(
          HsDrawLayerMetadataDialogComponent,
          {},
        );
      });
    super.ngOnInit();
    this.selectedOption
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((option) => {
        if (option == 'edit') {
          this.hsDrawService.setType(this.hsDrawService.type);
        }
      });
  }
}
