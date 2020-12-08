import {Component} from '@angular/core';
import {HsConfig} from './config.service';

@Component({
  selector: 'hs',
  templateUrl: './hslayers.html',
  styles: [],
})
export class HslayersComponent {
  constructor(public HsConfig: HsConfig) {}
}
