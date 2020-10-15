import {Component, ViewRef} from '@angular/core';
import {HsCompositionsService} from './compositions.service';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
@Component({
  selector: 'hs.compositions-overwrite-dialog',
  template: require('./partials/dialog_overwriteconfirm.html'),
})
export class HsCompositionsOverwriteDialogComponent
  implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    private HsDialogContainerService: HsDialogContainerService,
    private HsCompositionsService: HsCompositionsService
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
