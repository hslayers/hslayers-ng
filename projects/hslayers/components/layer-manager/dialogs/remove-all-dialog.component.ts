import {Component, Input, ViewRef} from '@angular/core';

import {HsCompositionsParserService} from 'hslayers-ng/shared/compositions';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/shared/event-bus';
import {HsLayerManagerService} from 'hslayers-ng/shared/layer-manager';
import {HsMapService} from 'hslayers-ng/shared/map';
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
    private hsMapService: HsMapService,
  ) {}

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

    this.HsEventBusService.addedLayersRemoved.next();

    if (reloadComposition) {
      this.HsEventBusService.compositionLoadStarts.next(
        this.data.composition_id,
      );
    }
    this.close();
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
