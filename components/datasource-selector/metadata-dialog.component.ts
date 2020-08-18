import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'hs.metadataDialog',
  template: require('./partials/dialog_metadata.html'),
})
export class HsMetadataDialogComponent implements OnInit {
  metadataModalVisible: boolean;
  constructor() {}

  ngOnInit(): void {
    this.metadataModalVisible = true;
  }
}
