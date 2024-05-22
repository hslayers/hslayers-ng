import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {Subject, takeUntil} from 'rxjs';

import colorScales from 'colormap/colorScale';
import {Feature} from 'ol';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsStylerEditDialogComponent} from './edit-dialog/edit-dialog.component';
import {HsStylerService} from 'hslayers-ng/services/styler';
import {HsUploadedFiles} from 'hslayers-ng/common/upload';
import {HsUtilsService} from 'hslayers-ng/services/utils';

@Component({
  selector: 'hs-styles',
  templateUrl: './styler.component.html',
  styleUrls: ['./styler.component.scss'],
})
export class HsStylerComponent
  extends HsPanelBaseComponent
  implements OnDestroy {
  layerTitle: string;
  private end = new Subject<void>();
  uploaderVisible = false;
  downloadData: any;
  name = 'styler';
  colormaps = Object.keys(colorScales);
  constructor(
    public hsStylerService: HsStylerService,
    public hsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsUtilsService: HsUtilsService,
    public hsSaveMapService: HsSaveMapService,
    public hsDialogContainerService: HsDialogContainerService,
  ) {
    super();
    this.hsEventBusService.layerSelectedFromUrl
      .pipe(takeUntil(this.end))
      .subscribe((layer: Layer<Source>) => {
        if (layer !== null && this.hsUtilsService.instOf(layer, VectorLayer)) {
          this.hsStylerService.fill(layer as VectorLayer<Feature>);
        }
      });
    this.hsLayoutService.mainpanel$
      .pipe(takeUntil(this.end))
      .subscribe((which) => {
        if (which == 'styler') {
          this.hsStylerService.fill(this.hsStylerService.layer);
        }
      });
  }

  ngOnDestroy() {
    this.end.next();
    this.end.complete();
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
      } else if (confirmed == 'yes') {
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
