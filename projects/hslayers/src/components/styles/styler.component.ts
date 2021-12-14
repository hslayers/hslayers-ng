import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';
import {Component, OnDestroy} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSaveMapService} from '../save-map/save-map.service';
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
  private ngUnsubscribe = new Subject<void>();
  uploaderVisible = false;
  downloadData: any;
  name = 'styler';
  constructor(
    public hsStylerService: HsStylerService,
    public hsLayoutService: HsLayoutService,
    public hsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsUtilsService: HsUtilsService,
    public hsSaveMapService: HsSaveMapService
  ) {
    super(hsLayoutService);
    this.hsEventBusService.layerSelectedFromUrl
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((layer: Layer<Source>) => {
        if (layer !== null && this.hsUtilsService.instOf(layer, VectorLayer)) {
          this.hsStylerService.fill(
            layer as VectorLayer<VectorSource<Geometry>>
          );
        }
      });
    this.hsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        if (e == 'styler') {
          this.hsStylerService.fill(this.hsStylerService.layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  layermanager(): void {
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
      const sld = fileContents[0] as string;
      await this.hsStylerService.loadSld(sld);
    });
  }
}
