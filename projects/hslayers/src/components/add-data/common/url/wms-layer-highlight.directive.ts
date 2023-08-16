import {Directive, ElementRef, HostBinding} from '@angular/core';

import {HsUtilsService} from '../../../utils/utils.service';

@Directive({
  selector: '[hsWmsLayerHighlight]',
})
export class WmsLayerHighlightDirective {
  @HostBinding('class.hs-wms-highlighted') highlighted = false;

  constructor(
    private hsUtilsService: HsUtilsService,
    private elRef: ElementRef,
  ) {
    setTimeout(() => {
      this.highlighted = this.hsUtilsService.isOverflown(
        this.elRef.nativeElement,
      );
    }, 500);
  }
}
