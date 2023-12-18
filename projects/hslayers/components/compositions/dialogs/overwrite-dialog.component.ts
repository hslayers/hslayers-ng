import {Component, ViewRef} from '@angular/core';
import {HsCompositionsParserService} from '../compositions-parser.service';
import {HsCompositionsService} from '../compositions.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from '../../save-map/save-map-manager.service';

@Component({
  selector: 'hs-compositions-overwrite-dialog',
  templateUrl: './overwrite-dialog.component.html',
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
   * @public
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
   * @public
   * Save currently loaded composition first
   */
  save() {
    this.HsSaveMapManagerService.openPanel(null);
    this.close();
  }

  /**
   * @public
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
