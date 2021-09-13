import {Component, Input} from '@angular/core';

import {HsAddDataUrlService} from './../../url/add-data-url.service';

@Component({
  selector: 'hs-common-url-add-to-map',
  templateUrl: './common-url-add-to-map.component.html',
})
export class HsCommonUrlAddToMapComponent {
  @Input() layers: any;
  @Input() injectedService: any;
  @Input() hasChecked: boolean;
  selectAll = true;
  checkedLayers = {};

  constructor(public hsAddDataUrlService: HsAddDataUrlService) {}

  /**
   * @param layers
   * @description Select all layers from service.
   */
  selectAllLayers(): void {
    this.selectAll = !this.selectAll;
    this.checkAllLayers(this.layers);
  }

  checkAllLayers(layers: any[]): void {
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
    // this.zoomToLayers();
  }

  changed(): void {
    this.hasChecked = this.hsAddDataUrlService.searchForChecked(this.layers);
  }
}
