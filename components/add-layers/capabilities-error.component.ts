import {Component, OnInit} from '@angular/core';

@Component({
  selector: 'hs-get-capabilities-error',
  template: require('./partials/dialog_getcapabilities_error.html'),
})
export class HsGetCapabilitiesErrorComponent implements OnInit {
  capabilitiesErrorModalVisible;
  constructor() {}

  ngOnInit(): void {
    this.capabilitiesErrorModalVisible = true;
  }
}
