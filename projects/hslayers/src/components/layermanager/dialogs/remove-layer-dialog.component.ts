import {Component, Input, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsDrawService} from '../../draw/draw.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsMapService} from '../../map/map.service';

@Component({
  selector: 'hs-layermanager-remove-layer-dialog',
  templateUrl: './remove-layer-dialog.component.html',
})
export class HsLayerManagerRemoveLayerDialogComponent
  implements HsDialogComponent
{
  @Input() data: any;
  viewRef: ViewRef;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsEventBusService: HsEventBusService,
    public HsDrawService: HsDrawService,
    public HsMapService: HsMapService
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
