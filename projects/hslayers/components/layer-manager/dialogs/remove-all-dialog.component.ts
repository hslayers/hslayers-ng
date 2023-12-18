import {Component, Input, ViewRef} from '@angular/core';

import {HsCompositionsParserService} from '../../compositions/compositions-parser.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerManagerService} from '../layer-manager.service';
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
