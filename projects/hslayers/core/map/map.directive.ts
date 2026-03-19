import {Directive, ViewContainerRef, inject} from '@angular/core';

@Directive({
  selector: '[map]',
})
export class HsMapDirective {
  viewContainerRef = inject(ViewContainerRef);
}
