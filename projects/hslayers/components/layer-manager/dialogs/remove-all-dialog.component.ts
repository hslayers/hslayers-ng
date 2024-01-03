import {Component, Input, ViewRef} from '@angular/core';

import {HsCompositionsParserService} from '../../compositions/compositions-parser.service';
import {HsDialogComponent} from 'hslayers-ng/components/layout';
import {HsDialogContainerService} from 'hslayers-ng/components/layout';
import {HsEventBusService} from 'hslayers-ng/shared/core';
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
