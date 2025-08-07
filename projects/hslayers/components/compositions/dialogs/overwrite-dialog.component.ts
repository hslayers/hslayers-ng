import {Component, ViewRef, inject} from '@angular/core';

import {HsCompositionsParserService} from 'hslayers-ng/services/compositions';
import {HsCompositionsService} from '../compositions.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
import {HsSaveMapManagerService} from 'hslayers-ng/components/save-map';

@Component({
  selector: 'hs-compositions-overwrite-dialog',
  templateUrl: './overwrite-dialog.component.html',
  standalone: false,
})
export class HsCompositionsOverwriteDialogComponent
  implements HsDialogComponent
{
  hsDialogContainerService = inject(HsDialogContainerService);
  hsCompositionsService = inject(HsCompositionsService);
  hsSaveMapManagerService = inject(HsSaveMapManagerService);
  hsCompositionParserService = inject(HsCompositionsParserService);

  viewRef: ViewRef;
  data: any;

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  /**
   * Load new composition without saving old composition
   */
  overwrite() {
    this.hsCompositionsService.loadComposition(
      this.hsCompositionsService.compositionToLoad.url,
      true,
    );
    this.close();
  }

  /**
   * Save currently loaded composition first
   */
  save() {
    this.hsSaveMapManagerService.openPanel(null);
    this.close();
  }

  /**
   * Load new composition (with service_parser Load function) and merge it with old composition
   */
  add() {
    this.hsCompositionsService.loadComposition(
      this.hsCompositionsService.compositionToLoad.url,
      false,
    );
    this.close();
  }
}
