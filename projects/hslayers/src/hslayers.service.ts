import {HsPanelConstructorService} from 'hslayers-ng/shared/panel-constructor';
import {Injectable} from '@angular/core';
@Injectable({
  providedIn: 'root',
})
export class HslayersService {
  constructor(private HsPanelConstructorService: HsPanelConstructorService) {}

  init() {
    console.log('test');
    console.log(this.HsPanelConstructorService);
  }
}
