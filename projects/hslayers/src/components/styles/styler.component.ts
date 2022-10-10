import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import colorScales from 'colormap/colorScale';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

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
  implements OnDestroy, OnInit {
  layerTitle: string;
  private ngUnsubscribe = new Subject<void>();
  uploaderVisible = false;
  downloadData: any;
  name = 'styler';
  appRef;
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
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((layer: Layer<Source>) => {
        if (layer !== null && this.hsUtilsService.instOf(layer, VectorLayer)) {
          this.hsStylerService.fill(
            layer as VectorLayer<VectorSource<Geometry>>,
            this.data.app
          );
        }
      });
    this.hsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(({which, app}) => {
        if (which == 'styler' && app == this.data.app) {
          this.hsStylerService.fill(this.appRef.layer, this.data.app);
        }
      });
  }
  ngOnInit(): void {
    this.appRef = this.hsStylerService.get(this.data.app);
    this.hsStylerService.init(this.data.app);
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  async close(): Promise<void> {
    if (this.appRef.unsavedChange) {
      const dialog = this.hsDialogContainerService.create(
        HsStylerEditDialogComponent,
        {},
        this.data.app
      );
      const confirmed = await dialog.waitResult();
      if (confirmed == 'no') {
        return;
      } else if (confirmed == 'yes') {
        this.hsStylerService.setSldQml(this.data.app);
      }
    }
    this.hsLayoutService.setMainPanel('layermanager', this.data.app);
  }

  uploadSld(): void {
    this.uploaderVisible = !this.uploaderVisible;
  }

  async clear(): Promise<void> {
    await this.hsStylerService.reset(this.data.app);
  }

  drop(event: CdkDragDrop<any[]>): void {
    moveItemInArray(
      this.appRef.styleObject.rules,
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
      await this.hsStylerService.loadStyle(styleString, this.data.app);
    });
  }
}
