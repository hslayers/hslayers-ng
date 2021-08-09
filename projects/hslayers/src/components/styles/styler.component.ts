import {Component, OnDestroy} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import VectorLayer from 'ol/layer/Vector';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from './../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsStylerService} from '../styles/styler.service';
import {HsUploadedFiles} from '../../common/upload/upload.component';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-styles',
  templateUrl: './styler.html',
})
export class HsStylerComponent implements OnDestroy {
  layerTitle: string;
  private ngUnsubscribe = new Subject();
  uploaderVisible = false;
  downloadData: any;

  constructor(
    public HsStylerService: HsStylerService,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    public sanitizer: DomSanitizer,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsUtilsService: HsUtilsService,
    public HsSaveMapService: HsSaveMapService
  ) {
    this.HsEventBusService.layerSelectedFromUrl
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((layer: VectorLayer) => {
        if (layer !== null) {
          this.HsStylerService.fill(layer);
        }
      });
    this.HsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((e) => {
        if (e == 'styler') {
          this.HsStylerService.fill(this.HsStylerService.layer);
        }
      });
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  layermanager(): void {
    this.HsLayoutService.setMainPanel('layermanager');
  }

  uploadSld(): void {
    this.uploaderVisible = !this.uploaderVisible;
  }

  async clear(): Promise<void> {
    await this.HsStylerService.reset();
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
      await this.HsStylerService.loadSld(sld);
    });
  }
}
