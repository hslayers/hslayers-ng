import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Subject} from 'rxjs/internal/Subject';

import {FileDescriptor} from '../file/types/file-descriptor.type';
import {HsAddDataCommonService} from './common.service';
import {HsAddDataService} from '../add-data.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLanguageService} from '../../language/language.service';
import {HsLaymanLayerDescriptor} from '../../save-map/layman-layer-descriptor.interface';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {PREFER_RESUMABLE_SIZE_LIMIT} from '../../save-map/layman-utils';
import {accessRightsModel} from '../common/access-rights.model';
import {errorMessageOptions} from '../file/types/error-message-options.type';
import {fileDataObject} from '../file/types/file-data-object.type';

@Injectable({providedIn: 'root'})
export class HsAddDataCommonFileService {
  loadingToLayman = false;
  asyncLoading = false;
  endpoint: HsEndpoint = null;
  layerAddedAsWms: Subject<boolean> = new Subject();
  dataObjectChanged: Subject<fileDataObject> = new Subject();
  constructor(
    private httpClient: HttpClient,
    private hsLog: HsLogService,
    public hsToastService: HsToastService,
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsLaymanService: HsLaymanService,
    public hsEventBusService: HsEventBusService,
    public hsAddDataCommonService: HsAddDataCommonService
  ) {}

  clearParams(): void {
    this.asyncLoading = false;
    this.endpoint = null;
    this.loadingToLayman = false;
  }

  getLoadingText(): string {
    return this.loadingToLayman
      ? this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          'uploading'
        )
      : this.hsLanguageService.getTranslationIgnoreNonExisting('COMMON', 'add');
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

  addTooltip(title: string): string {
    return title
      ? this.hsLanguageService.getTranslationIgnoreNonExisting(
          'DRAW.drawToolbar',
          'addLayer'
        )
      : this.hsLanguageService.getTranslationIgnoreNonExisting(
          'ADDLAYERS.SHP',
          'nameRequired'
        );
  }

  /**
   * Load non-wms OWS data and create layer
   * @param endpoint - Layman endpoint description (url, name, user)
   * @param files - Array of files
   * @param name - Name of new layer
   * @param title - Title of new layer
   * @param abstract - Abstract of new layer
   * @param srs - EPSG code of selected projection (eg. "EPSG:4326")
   * @param sld - Array of sld files
   * @returns
   */
  loadNonWmsLayer(
    endpoint: HsEndpoint,
    files: FileDescriptor[],
    name: string,
    title: string,
    abstract: string,
    srs: string,
    sld: FileDescriptor,
    access_rights: accessRightsModel
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const formdata = new FormData();
      files.forEach((file) => {
        formdata.append(
          'file',
          new Blob([file.content], {type: file.type}),
          file.name
        );
      });

      const files_to_async_upload = [];
      const sumFileSize = formdata
        .getAll('file')
        .filter((f) => (f as File).name)
        .reduce((prev, f) => prev + (f as File).size, 0);
      this.asyncLoading = sumFileSize >= PREFER_RESUMABLE_SIZE_LIMIT;
      if (this.asyncLoading) {
        this.hsLaymanService.switchFormDataToFileNames(
          formdata,
          files_to_async_upload
        );
      }

      if (sld) {
        formdata.append(
          'sld',
          new Blob([sld.content], {type: sld.type}),
          sld.name
        );
      }
      formdata.append('name', name);
      title = title == '' ? name : title;
      formdata.append('title', title);
      formdata.append('abstract', abstract);
      formdata.append('crs', srs);

      const write =
        access_rights['access_rights.write'] == 'private'
          ? endpoint.user
          : access_rights['access_rights.write'];
      const read =
        access_rights['access_rights.read'] == 'private'
          ? endpoint.user
          : access_rights['access_rights.read'];

      formdata.append('access_rights.write', write);
      formdata.append('access_rights.read', read);
      this.httpClient
        .post(
          `${endpoint.url}/rest/workspaces/${
            endpoint.user
          }/layers?${Math.random()}`,
          formdata,
          {withCredentials: true}
        )
        .toPromise()
        .then(async (data: any) => {
          //CHECK IF OK not auth etc.
          if (data && data.length > 0) {
            if (this.asyncLoading) {
              const promise = await this.hsLaymanService.asyncUpload(
                files_to_async_upload,
                data,
                endpoint
              );
              resolve(promise);
            } else {
              resolve(data);
            }
          } else {
            reject(data);
          }
        })
        .catch((err) => {
          this.hsLog.error(err);
          reject(err);
        });
    });
  }

  /**
   * Handler for button click to send file to layman and wait for
   * answer with wms service url to add to map
   */
  async addAsWms(data: fileDataObject): Promise<void> {
    try {
      this.loadingToLayman = true;
      if (!this.endpoint) {
        this.pickEndpoint();
      }
      if (!this.isSRSSupported(data)) {
        throw new Error(
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS.ERROR',
            'srsNotSupported'
          )
        );
      }
      this.loadNonWmsLayer(
        this.endpoint,
        data.files,
        data.name,
        data.title,
        data.abstract,
        data.srs,
        data.sld,
        data.access_rights
      )
        .then((response) => {
          data.name = response[0].name; //Name translated to Layman-safe name
          return this.describeNewLayer(this.endpoint, response[0].name);
        })
        .then((descriptor) => {
          if (descriptor?.file.error) {
            this.hsToastService.createToastPopupMessage(
              'ADDLAYERS.ERROR.someErrorHappened',
              this.hsLanguageService.getTranslationIgnoreNonExisting(
                'LAYMAN.ERROR',
                descriptor.file.error.code.toString()
              ),
              {
                serviceCalledFrom: 'HsAddDataCommonFileService',
                disableLocalization: true,
              }
            );
            return;
          }
          this.hsLaymanService.totalProgress = 0;
          this.hsAddDataService.selectType('url');
          this.layerAddedAsWms.next(true);
          setTimeout(() => {
            this.hsEventBusService.owsFilling.next({
              type: 'wms',
              uri: descriptor.wms.url,
              layer: data.name,
            });
          }, 500);
          return;
        })
        .catch((err) => {
          const errorMessage =
            err?.error?.message ?? err?.message == 'Wrong parameter value'
              ? `${err?.message} : ${err?.detail.parameter}`
              : err?.message;
          const errorDetails = err?.error?.detail?.missing_extensions
            ? Object.values(err.error.detail?.missing_extensions)
            : [];
          this.catchError({message: errorMessage, details: errorDetails});
        });
    } catch (err) {
      this.catchError({message: err.message, details: null});
    }
  }

  /**
   * @param endpoint - Selected endpoint (should be Layman)
   * @param layerName - Name of the layer to describe
   * @returns Description of Layman layer
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

  displayErrorMessage(_options: errorMessageOptions = {}): void {
    this.hsToastService.createToastPopupMessage(
      _options.header,
      _options.message,
      {
        serviceCalledFrom: 'HsAddDataCommonFileService',
        details: _options.details,
      }
    );
  }

  catchError(_options: errorMessageOptions = {}): void {
    this.displayErrorMessage({
      message: _options.message,
      header: _options.header ?? 'ADDLAYERS.ERROR.someErrorHappened',
      details: _options.details,
    });
    this.hsLaymanService.totalProgress = 0;
    this.layerAddedAsWms.next();
  }

  isSRSSupported(data: fileDataObject): boolean {
    return ['4326', '3857'].some((epsg) => data.srs.endsWith(epsg));
  }

  isAuthorized(): boolean {
    return this.hsLaymanService.getLaymanEndpoint().authenticated;
  }
}
