import {Component, Input} from '@angular/core';

import {HsAddDataUrlService} from '../../url/add-data-url.service';

@Component({
  selector: 'hs-common-url-add',
  templateUrl: './common-url-add.component.html',
})
export class HsCommonUrlAddComponent {
  @Input() layers: any;
  @Input() injectedService: any;
  selectAll = true;

  constructor(public hsAddDataUrlService: HsAddDataUrlService) {}

  /**
   * @param layers
   * Select all layers from service.
   */
  selectAllLayers(): void {
    this.selectAll = !this.selectAll;
    this.checkAllLayers(this.layers);
  }

  checkAllLayers(layers: any[]): void {
    if (!layers) {
      return;
    }
    for (const layer of layers) {
      layer.checked = false;
      layer.checked = !this.selectAll;
      if (layer.Layer) {
        this.checkAllLayers(layer.Layer);
      }
    }
    this.changed();
  }

  addLayers(checked: boolean): void {
    this.injectedService.addLayers(checked);
    //FIXME: to implement
    // this.injectedService.zoomToLayers();
  }

  changed(): void {
    this.hsAddDataUrlService.searchForChecked(this.layers);
  }
}
