import {Component, OnInit, ViewRef} from '@angular/core';

import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsSaveMapManagerService} from '../feature-services/save-map-manager.service';
@Component({
  selector: 'hs-save-map-dialog-save',
  templateUrl: './dialog-save.component.html',
})
export class HsSaveMapDialogComponent implements HsDialogComponent, OnInit {
  viewRef: ViewRef;
  data: {endpoint; app: string};
  appRef;
  constructor(
    public HsDialogContainerService: HsDialogContainerService,
    public HsSaveMapManagerService: HsSaveMapManagerService
  ) {}
  ngOnInit() {
    this.appRef = this.HsSaveMapManagerService.get(this.data.app);
  }

  close(): void {
    this.HsDialogContainerService.destroy(this, this.data.app);
  }
}
