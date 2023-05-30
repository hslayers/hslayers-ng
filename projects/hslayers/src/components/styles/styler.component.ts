import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import colorScales from 'colormap/colorScale';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsStylerEditDialogComponent} from './edit-dialog/edit-dialog.component';
import {HsStylerService} from '../styles/styler.service';
import {HsUploadedFiles} from '../../common/upload/upload.component';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-styles',
  templateUrl: './styler.component.html',
  styleUrls: ['./styler.component.scss'],
})
export class HsStylerComponent
  extends HsPanelBaseComponent
  implements OnDestroy
{
  layerTitle: string;
  private end = new Subject<void>();
  uploaderVisible = false;
  downloadData: any;
  name = 'styler';
  colormaps = Object.keys(colorScales);
  constructor(
    public hsStylerService: HsStylerService,
    public hsLayoutService: HsLayoutService,
    public hsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsUtilsService: HsUtilsService,
    public hsSaveMapService: HsSaveMapService,
    public hsDialogContainerService: HsDialogContainerService
  ) {
    super(hsLayoutService);
    this.hsEventBusService.layerSelectedFromUrl
      .pipe(takeUntil(this.end))
      .subscribe((layer: Layer<Source>) => {
        if (layer !== null && this.hsUtilsService.instOf(layer, VectorLayer)) {
          this.hsStylerService.fill(
            layer as VectorLayer<VectorSource<Geometry>>
          );
        }
      });
    this.hsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.end))
      .subscribe((which) => {
        if (which == 'styler') {
          this.hsStylerService.fill(this.hsStylerService.layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  async close(): Promise<void> {
    if (this.hsStylerService.unsavedChange) {
      const dialog = this.hsDialogContainerService.create(
        HsStylerEditDialogComponent,
        {}
      );
      const confirmed = await dialog.waitResult();
      if (confirmed == 'no') {
        return;
      } else if (confirmed == 'yes') {
        this.hsStylerService.setSldQml();
      }
    }
    this.hsLayoutService.setMainPanel('layermanager');
  }

  uploadSld(): void {
    this.uploaderVisible = !this.uploaderVisible;
  }

  async clear(): Promise<void> {
    await this.hsStylerService.reset();
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.hsStylerService.styleObject.rules,
      event.previousIndex,
      event.currentIndex
    );
  }

  handleFileUpload(evt: HsUploadedFiles): void {
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
