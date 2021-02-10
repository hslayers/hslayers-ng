import * as packageJson from '../../package.json';
import {Component, ElementRef} from '@angular/core';
import {HsEventBusService} from '../core/event-bus.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-impressum',
  templateUrl: './partials/impressum.html',
})
export class HsImpressumComponent {
  version = 'dev';
  logoDisabled = false;
  freeSpaceHeight: number;
  elem: any;
  constructor(
    public hsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    public el: ElementRef
  ) {
    this.elem = this.el.nativeElement;
    this.version = packageJson.version;
    this.HsEventBusService.sizeChanges.subscribe(() => {
      this.getFreeSpaceHeight();
    });
  }
  getFreeSpaceHeight(): void {
    const calculatedMargin = parseFloat(
      getComputedStyle(this.elem, null).marginTop.replace('px', '')
    );
    calculatedMargin + this.elem.offsetHeight > 90 && !isNaN(calculatedMargin)
      ? (this.logoDisabled = false)
      : (this.logoDisabled = true);
  }
}
