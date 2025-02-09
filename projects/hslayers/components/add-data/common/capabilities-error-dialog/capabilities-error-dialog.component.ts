import {Component, Input, OnInit, ViewRef} from '@angular/core';

import {
  HsDialogComponent,
  HsDialogContainerService,
} from 'hslayers-ng/common/dialogs';

@Component({
  selector: 'hs-get-capabilities-error',
  templateUrl: './capabilities-error-dialog.component.html',
  standalone: false,
})
export class HsGetCapabilitiesErrorComponent
  implements HsDialogComponent, OnInit
{
  @Input() data: any;

  capabilitiesErrorModalVisible;

  constructor(public hsDialogContainerService: HsDialogContainerService) {}
  viewRef: ViewRef;

  ngOnInit(): void {
    this.capabilitiesErrorModalVisible = true;
  }

  close(): void {
    this.hsDialogContainerService.destroy(this);
  }
}
