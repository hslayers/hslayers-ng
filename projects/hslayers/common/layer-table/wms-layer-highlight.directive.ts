import {Directive, ElementRef, HostBinding, inject} from '@angular/core';
import {isOverflown} from 'hslayers-ng/services/utils';

@Directive({
  selector: '[hsWmsLayerHighlight]',
  standalone: true,
})
export class WmsLayerHighlightDirective {
  private elRef = inject(ElementRef);

  @HostBinding('class.hs-wms-highlighted') highlighted = false;

  constructor() {
    setTimeout(() => {
      this.highlighted = isOverflown(this.elRef.nativeElement);
    }, 500);
  }
}
