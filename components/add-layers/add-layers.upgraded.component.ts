import {Directive, ElementRef, Injector, SimpleChanges} from '@angular/core';
import {UpgradeComponent} from '@angular/upgrade/static';

@Directive({
  selector: 'hs-add-layers',
})
export class HsAddLayersComponent extends UpgradeComponent {
  constructor(elementRef: ElementRef, injector: Injector) {
    super('hs.addLayers', elementRef, injector);
  }
}
