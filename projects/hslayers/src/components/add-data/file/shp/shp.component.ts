import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import {takeUntil} from 'rxjs/operators';

import {Subject} from 'rxjs';

import {HsFileShpService} from './shp.service';
import {HsAddDataService} from '../../add-data.service';

import {HsCommonEndpointsService} from '../../../../common/endpoints/endpoints.service';
import {HsEndpoint} from '../../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLanguageService} from '../../../language/language.service';
import {HsLaymanLayerDescriptor} from '../../../save-map/layman-layer-descriptor.interface';
import {HsLaymanService} from '../../../save-map/layman.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsLogService} from '../../../../common/log/log.service';
import {
  HsUploadComponent,
  HsUploadedFiles,
} from '../../../../common/upload/upload.component';
import {HsUtilsService} from '../../../utils/utils.service';
import {accessRightsModel} from '../../common/access-rights.model';
import {fileShpDataObject} from './shp-data.type';

@Component({
  selector: 'hs-file-shp',
  templateUrl: './shp.component.html',
})
export class HsFileShpComponent implements OnInit, OnDestroy, AfterViewInit {
  data: fileShpDataObject;
  endpoint: HsEndpoint = null;
  dropzoneActive = false;
  loading = false;
  fileInput: ElementRef;
  access_rights: accessRightsModel = {
    'access_rights.write': 'private',
    'access_rights.read': 'EVERYONE',
  };
  @ViewChild(HsUploadComponent) hsUploadComponent: HsUploadComponent;
  private ngUnsubscribe = new Subject();
  constructor(
    public hsFileShpService: HsFileShpService,
    public hsLayoutService: HsLayoutService,
    public hsLaymanService: HsLaymanService,
    public hsLog: HsLogService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataService: HsAddDataService,
    public hsEventBusService: HsEventBusService,
    public hsLanguageService: HsLanguageService
  ) {
    this.hsFileShpService.shpDataObjectChanged
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((data) => {
        this.data = data;
      });
  }

  ngAfterViewInit(): void {
    this.fileInput = this.hsUploadComponent.getVectorFileInput();
  }

  ngOnInit(): void {
    this.setToDefault();
    this.pickEndpoint();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  setToDefault(): void {
    this.hsFileShpService.setToDefaultData();
    if (this.fileInput?.nativeElement?.value) {
      this.fileInput.nativeElement.value = '';
    }
    this.dropzoneActive = false;
    this.loading = false;
  }

  isAuthorized(): boolean {
    return this.hsAddDataService.isAuthorized;
  }

  isSRSSupported(): boolean {
    return ['4326', '3857'].some((epsg) => this.data.srs.endsWith(epsg));
  }

  read(evt: HsUploadedFiles): void {
    this.hsFileShpService.read(evt);
  }

  loadingText(): string {
    return this.loading
      ? this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          'uploading'
        )
      : this.hsLanguageService.getTranslationIgnoreNonExisting('COMMON', 'add');
  }

  dropZoneState($event: boolean): void {
    this.dropzoneActive = $event;
  }

  /**
   * From available endpoints picks one
   * - either Layman endpoint if available or any other if not
   */
  pickEndpoint(): void {
    const endpoints = this.hsCommonEndpointsService.endpoints;
    if (endpoints && endpoints.length > 0) {
      const laymans = endpoints.filter((ep) => ep.type == 'layman');
      if (laymans.length > 0) {
        this.endpoint = laymans[0];
      } else {
        this.endpoint = endpoints[0];
      }
      if (this.endpoint && this.endpoint.type == 'layman') {
        this.endpoint.getCurrentUserIfNeeded(this.endpoint);
      }
    }
  }

  /**
   * @param endpoint Selected endpoint (should be Layman)
   * @param layerName Name of the layer to describe
   * @returns {Promise} Description of Layman layer
   */
  async describeNewLayer(
    endpoint: HsEndpoint,
    layerName: string
  ): Promise<HsLaymanLayerDescriptor> {
    try {
      const descriptor = await this.hsLaymanService.describeLayer(
        endpoint,
        layerName,
        endpoint.user
      );
      if (['STARTED', 'PENDING', 'SUCCESS'].includes(descriptor.wms.status)) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.describeNewLayer(endpoint, layerName));
          }, 2000);
        });
      } else {
        return descriptor;
      }
    } catch (ex) {
      this.hsLog.error(ex);
      throw ex;
    }
  }

  /**
   * Handler for button click to send shape file to layman and wait for
   * answer with wms service url to add to map
   */
  add(): void {
    try {
      this.loading = true;
      if (!this.endpoint) {
        this.pickEndpoint();
      }
      if (!this.isSRSSupported()) {
        throw new Error(
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS.ERROR',
            'srsNotSupported'
          )
        );
      }
      this.hsFileShpService
        .add(
          this.endpoint,
          this.data.files,
          this.data.name,
          this.data.title,
          this.data.abstract,
          this.data.srs,
          this.data.sld,
          this.access_rights
        )
        .then((data) => {
          this.data.name = data[0].name; //Name translated to Layman-safe name
          return this.describeNewLayer(this.endpoint, this.data.name);
        })
        .then((descriptor) => {
          this.hsLaymanService.totalProgress = 0;
          this.data.resultCode = 'success';
          this.hsAddDataService.selectType('url');
          setTimeout(() => {
            this.hsEventBusService.owsFilling.next({
              type: 'wms',
              uri: descriptor.wms.url,
              layer: this.data.name,
            });
          }, 500);
          this.hsLayoutService.setMainPanel('layermanager');
          this.setToDefault();
        })
        .catch((err) => {
          console.error(err);
          const errorMessage =
            err?.error?.message ?? err?.message == 'Wrong parameter value'
              ? `${err?.message} : ${err?.detail.parameter}`
              : err?.message;
          const errorDetails = err?.error?.detail?.missing_extensions
            ? Object.values(err.error.detail?.missing_extensions)
            : [];
          this.showError({message: errorMessage, details: errorDetails});
        });
    } catch (err) {
      this.showError({message: err.message, details: null});
    }
  }

  showError(e): void {
    this.loading = false;
    this.data.resultCode = 'error';
    this.data.errorMessage = e.message;
    this.data.errorDetails = e.details;
    this.hsLaymanService.totalProgress = 0;
    setTimeout(() => {
      this.data.resultCode = null;
    }, 5000);
  }

  addShpTooltip(): string {
    return this.data.title
      ? this.hsLanguageService.getTranslationIgnoreNonExisting(
          'DRAW.drawToolbar',
          'addLayer'
        )
      : this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS.SHP',
          'nameRequired'
        );
  }
}
