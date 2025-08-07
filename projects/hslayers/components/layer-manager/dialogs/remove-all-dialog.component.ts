import {Component, Input, ViewRef, inject} from '@angular/core';

import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsMapService} from 'hslayers-ng/services/map';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {
  getBase,
  getRemovable,
  getShowInLayerManager,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layermanager-remove-all-dialog',
  templateUrl: './remove-all-dialog.component.html',
  standalone: false,
})
export class HsLayerManagerRemoveAllDialogComponent
  implements HsDialogComponent
{
  hsLayerManagerService = inject(HsLayerManagerService);
  hsDialogContainerService = inject(HsDialogContainerService);
  hsEventBusService = inject(HsEventBusService);
  hsCompositionsParserService = inject(HsCompositionsParserService);
  private hsMapService = inject(HsMapService);

  @Input() data: any;
  viewRef: ViewRef;

  /**
   * Remove all non-base layers that were added to the map by user.
   * Doesn't remove layers added through app config (In case we want it to be 'removable', it can be set to true in the config.)
   */
  removeAllLayers(reloadComposition?: boolean): void {
    const to_be_removed = [];
    this.hsMapService
      .getMap()
      .getLayers()
      .forEach((lyr: Layer<Source>) => {
        if (getRemovable(lyr) == true) {
          if (!getBase(lyr)) {
            if (
              getShowInLayerManager(lyr) == undefined ||
              getShowInLayerManager(lyr) == true
            ) {
              to_be_removed.push(lyr);
            }
          }
        }
      });
    while (to_be_removed.length > 0) {
      this.hsMapService.getMap().removeLayer(to_be_removed.shift());
    }

    this.hsEventBusService.addedLayersRemoved.next();

    if (reloadComposition) {
      this.hsEventBusService.compositionLoadStarts.next(
        this.data.composition_id,
      );
    }
    this.close();
  }

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}
