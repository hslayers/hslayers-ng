import * as packageJson from '../../package.json';
import {Component, ElementRef, ViewChild} from '@angular/core';
import {HsEventBusService} from '../core/event-bus.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-impressum',
  templateUrl: './partials/impressum.html',
})
export class HsImpressumComponent {
  @ViewChild('hslogo') hsLogo: ElementRef;
  version = 'dev';
  logo = '';
  logoDisabled = false;
  logoHeight: number;
  constructor(
    public hsUtilsService: HsUtilsService,
    public HsEventBusService: HsEventBusService,
    public el: ElementRef
  ) {
    this.version = packageJson.version;
    this.HsEventBusService.sizeChanges.subscribe(() => {
      this.getLogoHeight();
      if (this.el.nativeElement.offsetHeight < this.logoHeight) {
        this.logoDisabled = true;
      }
    });
  }
  ngAfterViewInit(): void {
    this.getLogoHeight();
  }
  getLogoHeight(): void {
    this.logoHeight = this.hsLogo.nativeElement.clientHeight;
  }
}
