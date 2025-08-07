import {Directive, ViewContainerRef, inject} from '@angular/core';

@Directive({
  selector: '[hslayout]',
  standalone: false,
})
export class HsLayoutHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
