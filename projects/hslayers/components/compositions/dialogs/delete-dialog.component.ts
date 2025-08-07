import {Component, ViewRef, inject} from '@angular/core';

import {HsCompositionsService} from '../compositions.service';
import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';
@Component({
  selector: 'hs-compositions-delete-dialog',
  templateUrl: './delete-dialog.component.html',
  standalone: false,
})
export class HsCompositionsDeleteDialogComponent implements HsDialogComponent {
  hsDialogContainerService = inject(HsDialogContainerService);
  hsCompositionsService = inject(HsCompositionsService);

  viewRef: ViewRef;
  data: any;

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }

  /**
   * @param composition - Composition selected for deletion
   * Delete selected composition from project (including deletion from composition server, useful for user created compositions)
   */
  async delete(composition): Promise<void> {
    await this.hsCompositionsService.deleteComposition(composition);
    this.close();
  }
}
