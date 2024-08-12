import {Component, OnInit} from '@angular/core';

import {BehaviorSubject} from 'rxjs';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawLayerMetadataDialogComponent} from './draw-layer-metadata/draw-layer-metadata.component';

import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'hs-draw',
  templateUrl: './draw.component.html',
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
      .subscribe(() => {
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
