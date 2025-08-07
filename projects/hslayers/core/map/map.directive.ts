import { Directive, ViewContainerRef, inject } from '@angular/core';

@Directive({
  selector: '[map]',
  standalone: true,
})
export class HsMapDirective {
  viewContainerRef = inject(ViewContainerRef);
}
