import {Component, Input, ViewRef} from '@angular/core';

import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawService} from 'hslayers-ng/shared/draw';
import {HsEventBusService} from 'hslayers-ng/shared/core';
import {HsMapService} from 'hslayers-ng/components/map';

@Component({
  selector: 'hs-layermanager-remove-layer-dialog',
  templateUrl: './remove-layer-dialog.component.html',
})
export class HsLayerManagerRemoveLayerDialogComponent
  implements HsDialogComponent {
  @Input() data: any;
  viewRef: ViewRef;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsEventBusService: HsEventBusService,
    public HsDrawService: HsDrawService,
    public HsMapService: HsMapService,
  ) {}

  removeLayer(): void {
    if (this.HsDrawService.selectedLayer == this.data.olLayer) {
      this.HsDrawService.selectedLayer = null;
    }
    this.HsMapService.getMap().removeLayer(this.data.olLayer);
    this.HsDrawService.fillDrawableLayers();

    this.HsEventBusService.layerManagerUpdates.next(null);
    this.close();
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
