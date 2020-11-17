import {Component, Input, ViewRef} from '@angular/core';
import {HsDialogComponent} from '../layout/dialogs/dialog-component.interface';

@Component({
  selector: 'hs-get-capabilities-error',
  templateUrl: './partials/dialog_getcapabilities_error.html',
})
export class HsGetCapabilitiesErrorComponent implements HsDialogComponent {
  @Input() data: any;

  capabilitiesErrorModalVisible;

  constructor() {}
  viewRef: ViewRef;

  ngOnInit(): void {
    this.capabilitiesErrorModalVisible = true;
  }
}
