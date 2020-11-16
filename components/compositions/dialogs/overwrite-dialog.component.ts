import {Component, ViewRef} from '@angular/core';
import {HsCompositionsService} from '../compositions.service';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from '../../save-map/save-map-manager.service';
@Component({
  selector: 'hs-compositions-overwrite-dialog',
  templateUrl: './dialog_overwriteconfirm.html',
})
export class HsCompositionsOverwriteDialogComponent
  implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    private HsDialogContainerService: HsDialogContainerService,
    private HsCompositionsService: HsCompositionsService,
    private HsSaveMapManagerService: HsSaveMapManagerService
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  /**
   * @ngdoc method
   * @public
   * @description Load new composition without saving old composition
   */
  overwrite() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.compositionToLoad.url,
      true
    );
    this.close();
  }

  /**
   * @ngdoc method
   * @public
   * @description Save currently loaded composition first
   */
  save() {
    this.HsSaveMapManagerService.openPanel(null);
    this.close();
  }

  /**
   * @ngdoc method
   * @public
   * @description Load new composition (with service_parser Load function) and merge it with old composition
   */
  add() {
    this.HsCompositionsService.loadComposition(
      this.HsCompositionsService.compositionToLoad.url,
      false
    );
    this.close();
  }
}
