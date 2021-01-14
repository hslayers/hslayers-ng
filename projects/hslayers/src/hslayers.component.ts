import {Component} from '@angular/core';
import {HsConfig} from './config.service';

@Component({
  selector: 'hslayers',
  templateUrl: './hslayers.html',
  styles: [],
})
export class HslayersComponent {
  constructor(public HsConfig: HsConfig) {}
}
