import {Component, ViewRef} from '@angular/core';
import {HsCompositionsService} from '../compositions.service';
import {HsDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
@Component({
  selector: 'hs-compositions-delete-dialog',
  templateUrl: './delete-dialog.component.html',
})
export class HsCompositionsDeleteDialogComponent implements HsDialogComponent {
  viewRef: ViewRef;
  data: any;

  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsCompositionsService: HsCompositionsService,
  ) {}

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }

  /**
   * @public
   * @param composition - Composition selected for deletion
   * Delete selected composition from project (including deletion from composition server, useful for user created compositions)
   */
  async delete(composition): Promise<void> {
    await this.HsCompositionsService.deleteComposition(composition);
    this.close();
  }
}
