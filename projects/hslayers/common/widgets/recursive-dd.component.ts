import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import {transform} from 'ol/proj';

import {HsClipboardTextComponent} from 'hslayers-ng/common/clipboard-text';
import {HsMapService} from 'hslayers-ng/services/map';

@Component({
  selector: 'hs-widgets-recursive-dd',
  templateUrl: './recursive-dd.component.html',
  styleUrls: ['./recursive-dd.component.scss'],
  imports: [HsClipboardTextComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class HsUiExtensionsRecursiveDdComponent {
  value = input<any>();
  excludeKeys = input<string[]>([]);
  firstLevel = input<boolean>(false);

  private hsMapService = inject(HsMapService);

  isIterable = computed(() => {
    return this.value() && typeof this.value() === 'object';
  });

  entries = computed(() => {
    if (!this.isIterable()) {
      return [];
    }

    if (this.firstLevel()) {
      // If this is the first level, filter out excluded keys
      return Object.entries(this.value()).filter(
        ([key]) => !this.excludeKeys().includes(key),
      );
    }
    return Object.entries(this.value());
  });

  /**
   *
   *
   * FIXME: duplicity with HsAddDataCatalogueMapService
   * however it would be necessary to move many services to shared in case this is imported from
   * components/add-data
   *
   * ZoomTo / MoveTo to selected layer overview
   * @param bbox - Bounding box of selected layer
   */
  zoomTo(bboxValue: unknown): void {
    // Type guard to ensure we have a valid bbox
    if (!bboxValue) {
      return;
    }

    const bbox = bboxValue as string | number[];

    let b: string[] | number[] = null;
    if (typeof bbox === 'string') {
      b = bbox.split(' ');
    } else if (Array.isArray(bbox)) {
      b = bbox;
    } else {
      // Not a valid bbox format
      return;
    }
    let firstPair = [parseFloat(b[0] as string), parseFloat(b[1] as string)];
    let secondPair = [parseFloat(b[2] as string), parseFloat(b[3] as string)];

    const map = this.hsMapService.getMap();
    const projection = map.getView().getProjection();

    firstPair = transform(firstPair, 'EPSG:4326', projection);
    secondPair = transform(secondPair, 'EPSG:4326', projection);

    if (firstPair.some(isNaN) || secondPair.some(isNaN)) {
      return;
    }

    const extent = [firstPair[0], firstPair[1], secondPair[0], secondPair[1]];
    this.hsMapService.fitExtent(extent);
  }
}
