import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';

import JSZip from 'jszip';
import {Subject, lastValueFrom} from 'rxjs';

import {FileDescriptor} from '../file/types/file-descriptor.type';
import {HsAddDataCommonService} from './common.service';
import {HsAddDataOwsService} from '../url/add-data-ows.service';
import {HsAddDataService} from '../add-data.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../../language/language.service';
import {HsLaymanLayerDescriptor} from '../../save-map/interfaces/layman-layer-descriptor.interface';
import {HsLaymanService} from '../../save-map/feature-services/layman.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {PREFER_RESUMABLE_SIZE_LIMIT} from '../../save-map/layman-utils';
import {PostLayerResponse} from '../../../common/layman/post-layer-response.type';
import {accessRightsModel} from '../common/access-rights.model';
import {errorMessageOptions} from '../file/types/error-message-options.type';
import {fileDataObject} from '../file/types/file-data-object.type';

export const FILE_UPLOAD_SIZE_LIMIT = 10 * 1024 * 1024; //10MB

export class HsAddDataCommonFileServiceParams {
  loadingToLayman = false;
  asyncLoading = false;
  layerNameExists = false;
  endpoint: HsEndpoint = null;
  layerAddedAsWms: Subject<boolean> = new Subject();
  dataObjectChanged: Subject<fileDataObject> = new Subject();
}

@Injectable({providedIn: 'root'})
export class HsAddDataCommonFileService {
  apps: {
    [id: string]: HsAddDataCommonFileServiceParams;
  } = {default: new HsAddDataCommonFileServiceParams()};

  constructor(
    private httpClient: HttpClient,
    private hsLog: HsLogService,
    public hsToastService: HsToastService,
    public hsAddDataService: HsAddDataService,
    public hsLanguageService: HsLanguageService,
    public hsCommonEndpointsService: HsCommonEndpointsService,
    public hsLaymanService: HsLaymanService,
    public hsAddDataCommonService: HsAddDataCommonService,
    public hsAddDataOwsService: HsAddDataOwsService
  ) {}

  get(app: string): HsAddDataCommonFileServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataCommonFileServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  clearParams(app: string): void {
    const appRef = this.get(app);
    appRef.asyncLoading = false;
    appRef.endpoint = null;
    appRef.loadingToLayman = false;
    this.hsLaymanService.totalProgress = 0;
  }

  getLoadingText(app: string): string {
    return this.get(app).loadingToLayman
      ? this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          'uploading',
          undefined,
          app
        )
      : this.hsLanguageService.getTranslationIgnoreNonExisting(
          'COMMON',
          'add',
          undefined,
          app
        );
  }

  /**
   * From available endpoints picks one
   * - either Layman endpoint if available or any other if not
   * @param app - App identifier
   */
  pickEndpoint(app: string): void {
    const appRef = this.get(app);
    const endpoints = this.hsCommonEndpointsService.endpoints;
    if (endpoints && endpoints.length > 0) {
      const laymans = endpoints.filter((ep) => ep.type == 'layman');
      if (laymans.length > 0) {
        appRef.endpoint = laymans[0];
      } else {
        appRef.endpoint = endpoints[0];
      }
      if (appRef.endpoint && appRef.endpoint.type == 'layman') {
        appRef.endpoint.getCurrentUserIfNeeded(appRef.endpoint, app);
      }
    }
  }

  addTooltip(data: fileDataObject, app: string): string {
    let tooltipString;
    if (!data.srs && !data.name) {
      tooltipString = 'nameAndSRSRequired';
    }
    if (data.srs && !data.name) {
      tooltipString = 'nameRequired';
    }
    if (!data.srs && data.name) {
      tooltipString = 'SRSRequired';
    }
    if (tooltipString) {
      return this.hsLanguageService.getTranslationIgnoreNonExisting(
        'ADDLAYERS',
        tooltipString,
        undefined,
        app
      );
    } else {
      return this.hsLanguageService.getTranslationIgnoreNonExisting(
        'DRAW.drawToolbar',
        'addLayer',
        undefined,
        app
      );
    }
  }

  filesValid(files: File[], app: string): boolean {
    let isValid = true;
    if (files.filter((f) => f.size > FILE_UPLOAD_SIZE_LIMIT).length > 0) {
      this.catchError(
        {
          message: 'ADDDATA.FILE.someOfTheUploadedFiles',
        },
        app
      );
      return false;
    }
    const zipFilesCount = files.filter((file) => this.isZip(file.type)).length;
    if (zipFilesCount === 1 && files.length > 1) {
      this.catchError(
        {
          message: 'ADDDATA.FILE.zipFileCannotBeUploaded',
        },
        app
      );
      isValid = false;
    }
    if (zipFilesCount > 1) {
      isValid = false;
      this.catchError({message: 'ADDDATA.FILE.onlyOneZipFileCan'}, app);
    }
    return isValid;
  }

  isZip(type: string): boolean {
    return [
      'application/zip',
      'application/x-zip',
      'application/x-zip-compressed',
    ].includes(type);
  }

  isGeotiff(type: string): boolean {
    return ['image/tiff', 'image/tif', 'image/gtiff'].includes(type);
  }

  isJp2(type: string): boolean {
    return ['image/jp2'].includes(type);
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
    access_rights: accessRightsModel,
    app: string
  ): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const appRef = this.get(app);
      const formdata = new FormData();
      let zipContent;
      if (this.isZip(files[0].type)) {
        zipContent = new Blob([files[0].content], {type: files[0].type});
      } else {
        const zip = new JSZip();
        files.forEach((file) => {
          zip.file(file.name, file.content);
        });
        zipContent = await zip.generateAsync({type: 'blob'});
      }
      formdata.append('file', zipContent, files[0].name.split('.')[0] + '.zip');
      const files_to_async_upload: File[] = [];
      const sumFileSize = formdata
        .getAll('file')
        .filter((f) => (f as File).name)
        .reduce((prev, f) => prev + (f as File).size, 0);
      appRef.asyncLoading = sumFileSize >= PREFER_RESUMABLE_SIZE_LIMIT;
      if (appRef.asyncLoading) {
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
      try {
        const data = await lastValueFrom(
          this.httpClient.post<PostLayerResponse[]>(
            `${endpoint.url}/rest/workspaces/${
              endpoint.user
            }/layers?${Math.random()}`,
            formdata,
            {withCredentials: true}
          )
        );
        //CHECK IF OK not auth etc.
        if (data && data.length > 0) {
          if (appRef.asyncLoading) {
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
      } catch (err) {
        this.hsLog.error(err);
        reject(err);
      }
    });
  }

  /**
   * Handler for button click to send file to layman and wait for
   * answer with wms service url to add to map
   */
  async addAsWms(data: fileDataObject, app: string): Promise<void> {
    try {
      const appRef = this.get(app);
      appRef.loadingToLayman = true;
      if (!appRef.endpoint) {
        this.pickEndpoint(app);
      }
      if (!this.isSRSSupported(data)) {
        throw new Error(
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS.ERROR',
            'srsNotSupported',
            undefined,
            app
          )
        );
      }
      this.loadNonWmsLayer(
        appRef.endpoint,
        data.files,
        data.name,
        data.title,
        data.abstract,
        data.srs,
        data.sld,
        data.access_rights,
        app
      )
        .then((response) => {
          data.name = response[0].name; //Name translated to Layman-safe name
          return this.describeNewLayer(appRef.endpoint, response[0].name);
        })
        .then(async (descriptor) => {
          if (descriptor?.file.error) {
            this.hsToastService.createToastPopupMessage(
              this.hsLanguageService.getTranslation(
                'ADDLAYERS.ERROR.someErrorHappened',
                undefined,
                app
              ),
              this.hsLanguageService.getTranslationIgnoreNonExisting(
                'LAYMAN.ERROR',
                descriptor.file.error.code.toString(),
                undefined,
                app
              ),
              {
                serviceCalledFrom: 'HsAddDataCommonFileService',
                disableLocalization: true,
              },
              app
            );
            appRef.layerAddedAsWms.next(false);
            return;
          }
          this.hsLaymanService.totalProgress = 0;
          this.hsAddDataService.selectType('url', app);
          appRef.layerAddedAsWms.next(true);
          await this.hsAddDataOwsService.connectToOWS(
            {
              type: 'wms',
              uri: descriptor.wms.url,
              layer: data.name,
              owrCache: true,
            },
            app
          );
          return;
        })
        .catch((err) => {
          if (err?.code === 17) {
            this.clearParams(app);
            appRef.layerNameExists = true;
            return;
          }
          const errorMessage =
            err?.error?.message ?? err?.message == 'Wrong parameter value'
              ? `${err?.message} : ${err?.detail.parameter}`
              : err?.message;
          const errorDetails = err?.detail?.missing_extensions
            ? Object.values(err.detail?.missing_extensions)
            : [];
          this.catchError({message: errorMessage, details: errorDetails}, app);
        });
    } catch (err) {
      this.catchError({message: err.message, details: null}, app);
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
      if (
        ['UPDATING'].includes(descriptor.layman_metadata?.publication_status) ||
        ['STARTED', 'PENDING'].includes(descriptor.wms.status)
      ) {
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

  displayErrorMessage(_options: errorMessageOptions = {}, app: string): void {
    this.hsToastService.createToastPopupMessage(
      _options.header,
      _options.message,
      {
        serviceCalledFrom: 'HsAddDataCommonFileService',
        details: _options.details,
      },
      app
    );
  }

  catchError(_options: errorMessageOptions = {}, app: string): void {
    this.displayErrorMessage(
      {
        message: _options.message,
        header: _options.header ?? 'ADDLAYERS.ERROR.someErrorHappened',
        details: _options.details,
      },
      app
    );
    this.get(app).layerAddedAsWms.next(false);
  }

  isSRSSupported(data: fileDataObject): boolean {
    return this.hsLaymanService.supportedCRRList.some((epsg) =>
      data.srs.endsWith(epsg)
    );
  }

  isAuthorized(): boolean {
    return this.hsLaymanService.getLaymanEndpoint().authenticated;
  }

  setDataName(data: fileDataObject, app: string): void {
    data.name = data.files[0].name.slice(0, -4);
    data.title = data.files[0].name.slice(0, -4);
    this.get(app).dataObjectChanged.next(data);
  }
}
