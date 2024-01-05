import {Component, Input} from '@angular/core';
import {transform} from 'ol/proj';

import {HsMapService} from 'hslayers-ng/shared/map';

@Component({
  selector: 'hs-widgets-recursive-dd',
  templateUrl: './recursive-dd.component.html',
})
export class HsUiExtensionsRecursiveDdComponent {
  @Input() value: any;
  entries;

  constructor(public hsMapService: HsMapService) {}
  isIterable(): boolean {
    if (this.value && typeof this.value === 'object') {
      this.entries = Object.entries(this.value);
      return true;
    }
    return false;
  }

  /**
   *
   *
   * FIXME: duplcity with HsAddDataCatalogueMapService
   * however it would be necessary to move many services to shared in case this is imported from
   * components/add-data
   *
   * ZoomTo / MoveTo to selected layer overview
   * @param bbox - Bounding box of selected layer
   */
  zoomTo(bbox): void {
    if (!bbox) {
      return;
    }
    let b = null;
    if (typeof bbox === 'string') {
      b = bbox.split(' ');
    } else if (Array.isArray(bbox)) {
      b = bbox;
    }
    let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
    let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
    first_pair = transform(
      first_pair,
      'EPSG:4326',
      this.hsMapService.getMap().getView().getProjection(),
    );
    second_pair = transform(
      second_pair,
      'EPSG:4326',
      this.hsMapService.getMap().getView().getProjection(),
    );
    if (
      isNaN(first_pair[0]) ||
      isNaN(first_pair[1]) ||
      isNaN(second_pair[0]) ||
      isNaN(second_pair[1])
    ) {
      return;
    }
    const extent = [
      first_pair[0],
      first_pair[1],
      second_pair[0],
      second_pair[1],
    ];
    this.hsMapService.fitExtent(extent);
  }
}
