import {Component, Input, OnInit} from '@angular/core';

import {HsConfig} from 'hslayers-ng';

@Component({
  selector: 'hslayers-material',
  template: `
    <hs-mat-layout
      #hslayout
      style="height: 100%; max-height: 100vh; position: relative; width: 100%; display: block"
      class="hs-mat-layout"
      layout="column"
    ></hs-mat-layout>
  `,
  styles: [],
})
export class HslayersMaterialComponent implements OnInit {
  @Input() config: HsConfig;
  constructor(public HsConfig: HsConfig) {}

  ngOnInit(): void {
    if (this.config) {
      this.HsConfig.update(this.config);
    }
  }
}
