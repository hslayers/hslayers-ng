import {Directive, ViewContainerRef, inject} from '@angular/core';

@Directive({
  selector: '[hsPanelHost]',
  standalone: false,
})
export class HsPanelHostDirective {
  viewContainerRef = inject(ViewContainerRef);
}
