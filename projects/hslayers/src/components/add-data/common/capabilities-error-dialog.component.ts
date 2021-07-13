import {Component, Input, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../../layout/dialogs/dialog-component.interface';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';

@Component({
  selector: 'hs-get-capabilities-error',
  templateUrl: './capabilities-error-dialog.html',
})
export class HsGetCapabilitiesErrorComponent implements HsDialogComponent {
  @Input() data: any;

  capabilitiesErrorModalVisible;

  constructor(public hsDialogContainerService: HsDialogContainerService) {}
  viewRef: ViewRef;

  ngOnInit(): void {
    this.capabilitiesErrorModalVisible = true;
  }

  close() {
    this.hsDialogContainerService.destroy(this);
  }
}
