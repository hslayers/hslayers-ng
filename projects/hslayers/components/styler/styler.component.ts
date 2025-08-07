import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, computed, inject} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import colorScales from 'colormap/colorScale';
import {Feature} from 'ol';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {
  isLayerVectorLayer,
  normalizeSldComparisonOperators,
} from 'hslayers-ng/services/utils';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsStylerEditDialogComponent} from './edit-dialog/edit-dialog.component';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsUploadedFiles} from 'hslayers-ng/common/upload';

@Component({
  selector: 'hs-styles',
  templateUrl: './styler.component.html',
  styleUrls: ['./styler.component.scss'],
  standalone: false,
})
export class HsStylerComponent extends HsPanelBaseComponent {
  hsStylerService = inject(HsStylerService);
  hsEventBusService = inject(HsEventBusService);
  sanitizer = inject(DomSanitizer);
  hsSaveMapService = inject(HsSaveMapService);
  hsDialogContainerService = inject(HsDialogContainerService);

  layerTitle: string;
  uploaderVisible = false;

  /**
   * Normalized SLD which will be used for download.
   */
  sldForDownload = computed(() => {
    const sld = normalizeSldComparisonOperators(this.hsStylerService.sld());
    return sld;
  });
  downloadData: any;

  name = 'styler';
  colormaps = Object.keys(colorScales);

  constructor() {
    super();
    this.hsEventBusService.layerSelectedFromUrl
      .pipe(takeUntilDestroyed())
      .subscribe((layer: Layer<Source>) => {
        if (layer !== null && isLayerVectorLayer(layer, false)) {
          this.hsStylerService.fill(
            layer as VectorLayer<VectorSource<Feature>>,
          );
        }
      });
    this.hsLayoutService.mainpanel$
      .pipe(takeUntilDestroyed())
      .subscribe((which) => {
        if (which == 'styler') {
          this.hsStylerService.fill(this.hsStylerService.layer());
        }
      });
  }

  async close() {
    if (this.hsStylerService.unsavedChange) {
      const dialog = this.hsDialogContainerService.create(
        HsStylerEditDialogComponent,
        {},
      );
      const confirmed = await dialog.waitResult();
      if (confirmed == 'no') {
        return;
      }
      if (confirmed == 'yes') {
        this.hsStylerService.setSldQml();
      }
    }
    this.hsLayoutService.setMainPanel('layerManager');
  }

  uploadSld() {
    this.uploaderVisible = !this.uploaderVisible;
  }

  async clear() {
    await this.hsStylerService.reset();
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.hsStylerService.styleObject.rules,
      event.previousIndex,
      event.currentIndex,
    );
    this.hsStylerService.save();
  }

  handleFileUpload(evt: HsUploadedFiles) {
    const files = Array.from(evt.fileList);
    const promises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(file);
      });
    });
    Promise.all(promises).then(async (fileContents) => {
      const styleString = fileContents[0] as string;
      await this.hsStylerService.loadStyle(styleString);
    });
  }
}
