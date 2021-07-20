import {Component, Input, OnInit} from '@angular/core';
import {HsConfig} from './config.service';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'hslayers',
  templateUrl: './hslayers.html',
  styles: [],
})
export class HslayersComponent implements OnInit {
  @Input() config: HsConfig;
  constructor(public HsConfig: HsConfig) {}
  ngOnInit(): void {
    if (this.config) {
      this.HsConfig.update(this.config);
    }
  }
}
