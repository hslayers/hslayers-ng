import {Injectable} from '@angular/core';

import JSZip from 'jszip';
import {Subject} from 'rxjs';

import {AsyncUpload} from '../../save-map/types/async-upload.type';
import {FileDataObject} from '../file/types/file-data-object.type';
import {FileDescriptor} from '../file/types/file-descriptor.type';
import {HsAddDataOwsService} from '../url/add-data-ows.service';
import {HsAddDataService} from '../add-data.service';
import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsDialogContainerService} from '../../layout/dialogs/dialog-container.service';
import {HsEndpoint} from '../../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../../language/language.service';
import {HsLayerOverwriteDialogComponent} from '../dialog-overwrite-layer/overwrite-layer.component';
import {HsLaymanLayerDescriptor} from '../../save-map/interfaces/layman-layer-descriptor.interface';
import {HsLaymanService} from '../../save-map/layman.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsToastService} from '../../layout/toast/toast.service';
import {OverwriteResponse} from '../enums/overwrite-response';
import {PostPatchLayerResponse} from '../../../common/layman/types/post-patch-layer-response.type';
import {VectorDataObject} from '../vector/vector-data.type';
import {accessRightsModel} from '../common/access-rights.model';
import {errorMessageOptions} from '../file/types/error-message-options.type';

export const FILE_UPLOAD_SIZE_LIMIT = 10 * 1024 * 1024; //10MB

export class HsAddDataCommonFileServiceParams {
  loadingToLayman = false;
  asyncLoading = false;
  endpoint: HsEndpoint = null;
  layerAddedAsWms: Subject<boolean> = new Subject();
  dataObjectChanged: Subject<FileDataObject> = new Subject();
}

@Injectable({providedIn: 'root'})
export class HsAddDataCommonFileService {
  apps: {
    [id: string]: HsAddDataCommonFileServiceParams;
  } = {default: new HsAddDataCommonFileServiceParams()};

  constructor(
    private hsLog: HsLogService,
    private hsToastService: HsToastService,
    private hsAddDataService: HsAddDataService,
    private hsLanguageService: HsLanguageService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsLaymanService: HsLaymanService,
    private hsAddDataOwsService: HsAddDataOwsService,
    private hsDialogContainerService: HsDialogContainerService
  ) {}

  /**
   * Get the params saved by the add data common file service for the current app
   * @param app - App identifier
   */
  get(app: string): HsAddDataCommonFileServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataCommonFileServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Clear service param values to default values
   * @param app - App identifier
   */
  clearParams(app: string): void {
    const appRef = this.get(app);
    appRef.asyncLoading = false;
    appRef.endpoint = null;
    appRef.loadingToLayman = false;
    this.hsLaymanService.totalProgress = 0;
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

  /**
   * Get tooltip translated text
   * @param data - File data object provided
   * @param app - App identifier
   * @returns Translated string
   */
  getToolTipText(data: FileDataObject, app: string): string {
    if (!data.srs) {
      return this.hsLanguageService.getTranslationIgnoreNonExisting(
        'ADDLAYERS',
        'SRSRequired',
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

  /**
   * Validate files before upload
   * @param files - Files provided for upload
   * @param app - App identifier
   * @returns True, if files are valid for upload, false otherwise
   */
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

  /**
   * Check if file is a zip archive
   * @param type - Uploaded file type
   * @returns True, if upload file is a zip file, false otherwise
   */
  isZip(type: string): boolean {
    return [
      'application/zip',
      'application/x-zip',
      'application/x-zip-compressed',
    ].includes(type);
  }

  /**
   * Check if file is a geotiff image
   * @param type - Uploaded file type
   * @returns True, if upload file is a geotiff image, false otherwise
   */
  isGeotiff(type: string): boolean {
    return ['image/tiff', 'image/tif', 'image/gtiff'].includes(type);
  }

  /**
   * Check if file is a jp2 image
   * @param type - Uploaded file type
   * @returns True, if upload file is a jp2 image, false otherwise
   */
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
   * @param access_rights - User access rights for the new layer,
   * @param app - App identifier
   * @param overwrite - (Optional) Overwrite existing layman layer
   * @returns
   */
  async loadNonWmsLayer(
    endpoint: HsEndpoint,
    files: FileDescriptor[],
    name: string,
    title: string,
    abstract: string,
    srs: string,
    sld: FileDescriptor,
    access_rights: accessRightsModel,
    app: string,
    overwrite?: boolean
  ): Promise<PostPatchLayerResponse> {
    const appRef = this.get(app);
    const formData = await this.constructFormData(
      endpoint,
      files,
      name,
      title,
      abstract,
      srs,
      sld,
      access_rights
    );
    const asyncUpload: AsyncUpload =
      this.hsLaymanService.prepareAsyncUpload(formData);
    appRef.asyncLoading = asyncUpload.async;
    try {
      const res = await this.hsLaymanService.tryLoadLayer(
        endpoint,
        formData,
        asyncUpload,
        name,
        overwrite
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Construct a set of key/value pairs from, that can be easily sent using HTTP
   * @param endpoint - Layman endpoint description (url, name, user)
   * @param files - Array of files
   * @param name - Name of new layer
   * @param title - Title of new layer
   * @param abstract - Abstract of new layer
   * @param srs - EPSG code of selected projection (eg. "EPSG:4326")
   * @param sld - Array of sld files
   * @param access_rights - User access rights for the new layer,
   * @returns Formdata object for HTTP request
   */
  async constructFormData(
    endpoint: HsEndpoint,
    files: FileDescriptor[],
    name: string,
    title: string,
    abstract: string,
    srs: string,
    sld: FileDescriptor,
    access_rights: accessRightsModel
  ): Promise<FormData> {
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
    return formdata;
  }

  /**
   * Handler for button click to send file to layman and wait for
   * answer with wms service url to add to map
   * @param data - Current data object for upload
   * @param app - App identifier
   * @param overwrite - (Optional) Overwrite existing layman layer
   */
  async addAsWms(
    data: FileDataObject,
    app: string,
    overwrite?: boolean
  ): Promise<void> {
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
      const response = await this.loadNonWmsLayer(
        appRef.endpoint,
        data.files,
        data.name,
        data.title,
        data.abstract,
        data.srs,
        data.sld,
        data.access_rights,
        app,
        overwrite
      );
      if (response?.code) {
        await this.postLoadNonWmsError(response, data, app);
      } else {
        await this.postLoadNonWmsSuccess(response, data, app);
      }
    } catch (err) {
      this.catchError({message: err.message, details: null}, app);
    }
  }

  /**
   * Open overwrite layer dialog
   * @param data - Current data object for upload
   * @param app - App identifier
   */
  async loadOverwriteLayerDialog(
    data: FileDataObject | VectorDataObject,
    app: string
  ): Promise<OverwriteResponse> {
    const dialogRef = this.hsDialogContainerService.create(
      HsLayerOverwriteDialogComponent,
      {
        dataObj: data,
        app,
      },
      app
    );
    return await dialogRef.waitResult();
  }

  /**
   * Process error server response after trying to load non-wms layer
   * @param response - Http post/past response after loading layer to Layman
   * @param data - Current data object to load
   * @param app - App identifier
   */
  async postLoadNonWmsError(
    response: PostPatchLayerResponse,
    data: FileDataObject,
    app: string
  ): Promise<void> {
    if (response.code == 17) {
      const result = await this.loadOverwriteLayerDialog(data, app);
      switch (result) {
        case OverwriteResponse.add:
          this.addAsWms(data, app);
          break;
        case OverwriteResponse.overwrite:
          this.addAsWms(data, app, true);
          break;
        case OverwriteResponse.cancel:
        default:
          this.get(app).loadingToLayman = false;
          return;
      }
    } else {
      const errorMessage =
        response?.error?.message ?? response?.message == 'Wrong parameter value'
          ? `${response?.message} : ${response?.detail.parameter}`
          : response?.message;
      const errorDetails = response?.detail?.missing_extensions
        ? Object.values(response.detail?.missing_extensions)
        : [];
      this.catchError({message: errorMessage, details: errorDetails}, app);
    }
  }

  /**
   * Process success server response after trying to load non-wms layer
   * @param response - Http post/past response after loading layer to Layman
   * @param data - Current data object to load
   * @param app - App identifier
   */
  async postLoadNonWmsSuccess(
    response: PostPatchLayerResponse,
    data: FileDataObject,
    app: string
  ): Promise<void> {
    const appRef = this.get(app);
    data.name = response.name; //Name translated to Layman-safe name
    const descriptor = await this.describeNewLayer(
      appRef.endpoint,
      response.name
    );
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
      if (['STARTED', 'PENDING'].includes(descriptor?.wms.status)) {
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
   * Display error message toast, when called
   * @param _options - Error message options: message, header or details
   * @param app - App identifier
   */
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

  /**
   * Display error message toast, when called and broadcast event about a failed attempt to load wms layer
   * @param _options - Error message options: message, header or details
   * @param app - App identifier
   */
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

  /**
   * Check if srs from data is supported by Layman
   * @param data - Current data object to load
   * @returns True, if srs is supported, false otherwise
   */
  isSRSSupported(data: FileDataObject): boolean {
    return this.hsLaymanService.supportedCRRList.some((epsg) =>
      data.srs.endsWith(epsg)
    );
  }

  /**
   * Check if user is authorized as Layman user
   * @returns True, if user is authorized, false otherwise
   */
  isAuthorized(): boolean {
    return this.hsLaymanService.getLaymanEndpoint().authenticated;
  }

  /**
   * Set data object name based on uploaded files
   * @param data - Current data object to load
   * @param app - App identifier
   */
  setDataName(data: FileDataObject, app: string): void {
    data.name = data.files[0].name.slice(0, -4);
    data.title = data.files[0].name.slice(0, -4);
    this.get(app).dataObjectChanged.next(data);
  }
}
