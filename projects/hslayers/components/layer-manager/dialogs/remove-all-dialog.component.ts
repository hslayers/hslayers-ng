import {Component, Input, ViewRef} from '@angular/core';

import {HsCompositionsParserService} from 'hslayers-ng/shared/compositions';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLayerManagerService} from 'hslayers-ng/shared/layer-manager';
@Component({
  selector: 'hs-layermanager-remove-all-dialog',
  templateUrl: './remove-all-dialog.component.html',
})
export class HsLayerManagerRemoveAllDialogComponent
  implements HsDialogComponent {
  @Input() data: any;
  viewRef: ViewRef;

  constructor(
    public HsLayerManagerService: HsLayerManagerService,
    public HsDialogContainerService: HsDialogContainerService,
    public HsEventBusService: HsEventBusService,
    public hsCompositionsParserService: HsCompositionsParserService,
  ) {}

  removeAllLayers(reloadComposition?: boolean): void {
    this.HsLayerManagerService.removeAllLayers();
    if (reloadComposition) {
      this.HsEventBusService.compositionLoadStarts.next(
        this.HsLayerManagerService.composition_id,
      );
    }
    this.close();
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
