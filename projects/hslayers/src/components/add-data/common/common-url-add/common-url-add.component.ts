import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

import {HsAddDataUrlService} from '../../url/add-data-url.service';

@Component({
  selector: 'hs-common-url-add',
  templateUrl: './common-url-add.component.html',
})
export class HsCommonUrlAddComponent implements OnChanges {
  @Input() layers: any;
  @Input() injectedService: any;
  @Input() hasChecked: boolean;
  selectAll = true;

  constructor(public hsAddDataUrlService: HsAddDataUrlService) {}

  /**
   * @param layers
   * @description Select all layers from service.
   */
  selectAllLayers(): void {
    this.selectAll = !this.selectAll;
    this.checkAllLayers(this.layers);
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.hasChecked = changes?.hasChecked?.currentValue;
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
    // this.injectedService.zoomToLayers();
  }

  changed(): void {
    this.hasChecked = this.hsAddDataUrlService.searchForChecked(this.layers);
  }
}
