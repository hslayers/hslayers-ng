import {Directive, ElementRef, HostBinding} from '@angular/core';
import {isOverflown} from 'hslayers-ng/services/utils';

@Directive({
  selector: '[hsWmsLayerHighlight]',
  standalone: true,
})
export class WmsLayerHighlightDirective {
  @HostBinding('class.hs-wms-highlighted') highlighted = false;

  constructor(private elRef: ElementRef) {
    setTimeout(() => {
      this.highlighted = isOverflown(this.elRef.nativeElement);
    }, 500);
  }
}
