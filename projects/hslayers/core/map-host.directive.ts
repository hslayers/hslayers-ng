import {Directive, ViewContainerRef, inject} from '@angular/core';
@Directive({
  selector: '[hsMapHost]',
  standalone: false,
})
export class HsMapHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
