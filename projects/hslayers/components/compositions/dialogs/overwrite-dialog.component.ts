import {Component, ViewRef} from '@angular/core';

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
  viewRef: ViewRef;
  data: any;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsService: HsCompositionsService,
    public HsSaveMapManagerService: HsSaveMapManagerService,
    public hsCompositionParserService: HsCompositionsParserService,
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  /**
   * Load new composition without saving old composition
   */
  overwrite() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.compositionToLoad.url,
      true,
    );
    this.close();
  }

  /**
   * Save currently loaded composition first
   */
  save() {
    this.HsSaveMapManagerService.openPanel(null);
    this.close();
  }

  /**
   * Load new composition (with service_parser Load function) and merge it with old composition
   */
  add() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.compositionToLoad.url,
      false,
    );
    this.close();
  }
}
