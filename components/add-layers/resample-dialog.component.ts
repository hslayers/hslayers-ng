import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'hs-resample-dialog',
  templateUrl: './partials/dialog_proxyconfirm.html',
})
export class HsResampleDialogComponent implements OnInit {
  resampleModalVisible: boolean;
  constructor() {}

  ngOnInit(): void {
    this.resampleModalVisible = true;
  }
}
