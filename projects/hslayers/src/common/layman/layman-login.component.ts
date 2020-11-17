import {Component, ViewRef} from '@angular/core';
import {HsCommonLaymanService} from './layman.service';
import {HsDialogComponent} from '../../components/layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../components/layout/dialogs/dialog-container.service';
import {Input} from '@angular/core';

@Component({
  selector: 'hs-layman-login',
  templateUrl: './layman-login.html',
})
export class HsLaymanLoginComponent implements HsDialogComponent {
  @Input() url;
  viewRef: ViewRef;
  data = {};
  constructor(
    public HsCommonLaymanService: HsCommonLaymanService,
    public HsDialogContainerService: HsDialogContainerService
  ) {
    this.HsCommonLaymanService.authChange.subscribe((endpoint) => {
      this.close();
    });
  }

  close(): void {
    this.HsDialogContainerService.destroy(this);
  }
}
