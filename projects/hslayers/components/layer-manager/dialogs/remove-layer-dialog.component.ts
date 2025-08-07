import {Component, Input, ViewRef, inject} from '@angular/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsMapService} from 'hslayers-ng/services/map';

@Component({
  selector: 'hs-layermanager-remove-layer-dialog',
  templateUrl: './remove-layer-dialog.component.html',
  standalone: false,
})
export class HsLayerManagerRemoveLayerDialogComponent
  implements HsDialogComponent
{
  hsDialogContainerService = inject(HsDialogContainerService);
  hsEventBusService = inject(HsEventBusService);
  hsDrawService = inject(HsDrawService);
  hsMapService = inject(HsMapService);

  @Input() data: any;
  viewRef: ViewRef;

  removeLayer(): void {
    if (this.hsDrawService.selectedLayer == this.data.olLayer) {
      this.hsDrawService.selectedLayer = null;
    }
    this.hsMapService.getMap().removeLayer(this.data.olLayer);
    this.hsDrawService.fillDrawableLayers();

    this.hsEventBusService.layerManagerUpdates.next(null);
    this.close();
  }

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}
