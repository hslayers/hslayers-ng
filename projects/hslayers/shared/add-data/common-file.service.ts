import {Injectable} from '@angular/core';

import JSZip from 'jszip';
import {Subject} from 'rxjs';

import {HsAddDataOwsService} from './url/add-data-ows.service';
import {HsAddDataService} from './add-data.service';
import {HsAddDataUrlService} from './url/add-data-url.service';
import {HsCommonEndpointsService} from 'hslayers-ng/shared/endpoints';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsLogService} from 'hslayers-ng/shared/log';
import {HsUtilsService} from 'hslayers-ng/shared/utils';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsToastService} from 'hslayers-ng/common/toast';
import {PostPatchLayerResponse} from 'hslayers-ng/common/layman';
import {
  getLaymanFriendlyLayerName,
  layerParamPendingOrStarting,
} from 'hslayers-ng/common/layman';

import {AsyncUpload} from 'hslayers-ng/types';
import {FileDataObject} from 'hslayers-ng/types';
import {FileFormData} from 'hslayers-ng/types';
import {HsEndpoint} from 'hslayers-ng/types';
import {HsLayerOverwriteDialogComponent} from 'hslayers-ng/common/dialogs';
import {HsLaymanLayerDescriptor} from 'hslayers-ng/types';
import {OverwriteResponse} from 'hslayers-ng/types';
import {VectorDataObject} from 'hslayers-ng/types';

export type errorMessageOptions = {
  message?: string;
  header?: string;
  details?: any;
};

export const FILE_UPLOAD_SIZE_LIMIT = 10485760 as const; //10 * 1024 * 1024 = 10MB

export class HsAddDataCommonFileServiceParams {
  readingData = false;
  loadingToLayman = false;
  asyncLoading = false;
  endpoint: HsEndpoint = null;
  /**
   * @param success - true when layer added successfully
   */
  layerAddedAsService: Subject<boolean> = new Subject();
  dataObjectChanged: Subject<FileDataObject> = new Subject();
  fileUploadErrorHeader = 'ADDLAYERS.couldNotUploadSelectedFile';
}

@Injectable({providedIn: 'root'})
export class HsAddDataCommonFileService extends HsAddDataCommonFileServiceParams {
  constructor(
    private hsAddDataOwsService: HsAddDataOwsService,
    private hsAddDataUrlService: HsAddDataUrlService,
    private hsAddDataService: HsAddDataService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsDialogContainerService: HsDialogContainerService,
    private hsLanguageService: HsLanguageService,
    private hsLaymanService: HsLaymanService,
    private hsLog: HsLogService,
    private hsToastService: HsToastService,
    private hsUtilsService: HsUtilsService,
    private hsCommonLaymanService: HsCommonLaymanService,
  ) {
    super();
  }

  /**
   * Clear service param values to default values
   */
  clearParams(): void {
    this.asyncLoading = false;
    this.endpoint = null;
    this.loadingToLayman = false;
    this.hsLaymanService.totalProgress = 0;
  }

  /**
   * Check if provided URL exists and is obtainable
   * @param url - Provided URL
   */
  async isUrlObtainable(url: string): Promise<boolean> {
    if (!url || url === '') {
      return;
    }
    url = this.hsUtilsService.proxify(url);
    try {
      const response = await fetch(url, {
        method: 'GET',
      });
      const contentType = response.headers.get('Content-Type');
      if (response.status === 200) {
        if (contentType.includes('text/html')) {
          this.hsAddDataUrlService.addDataCapsParsingError.next(
            'ERROR.noValidData',
          );
          return;
        }
        return true;
      } else {
        this.hsAddDataUrlService.addDataCapsParsingError.next(
          response.statusText,
        );
        return;
      }
    } catch (e) {
      this.hsAddDataUrlService.addDataCapsParsingError.next(e.message);
      return;
    }
  }

  /**
   * From available endpoints picks one
   * - either Layman endpoint if available or any other if not
   */
  pickEndpoint(): void {
    const endpoints = this.hsCommonEndpointsService.endpoints;
    if (endpoints && endpoints.length > 0) {
      const layman = this.hsCommonLaymanService.layman;
      if (layman) {
        this.endpoint = layman;
        this.endpoint.getCurrentUserIfNeeded(this.endpoint);
      } else {
        this.endpoint = endpoints[0];
      }
    }
  }

  /**
   * Get tooltip translated text
   * @param data - File data object provided
   * @returns Translated string
   */
  getToolTipText(data: FileDataObject): string {
    if (!data.srs) {
      return this.hsLanguageService.getTranslationIgnoreNonExisting(
        'ADDLAYERS',
        'SRSRequired',
        undefined,
      );
    } else {
      return this.hsLanguageService.getTranslationIgnoreNonExisting(
        'DRAW.drawToolbar',
        'addLayer',
        undefined,
      );
    }
  }

  /**
   * Validate files before upload
   * @param files - Files provided for upload
   * @returns True, if files are valid for upload, false otherwise
   */
  filesValid(files: File[]): boolean {
    let isValid = true;
    if (
      files.find(
        (f) => f.name.endsWith('shp') && f.size > FILE_UPLOAD_SIZE_LIMIT,
      )
    ) {
      this.hsToastService.createToastPopupMessage(
        'ADDLAYERS.SHP.exceedingSize',
        'ADDLAYERS.SHP.considerUsingZip',
        {
          serviceCalledFrom: 'HsAddDataCommonFileService',
          toastStyleClasses: 'bg-warning text-white',
        },
      );
    }
    const zipFilesCount = files.filter((file) => this.isZip(file.type)).length;
    if (zipFilesCount === 1 && files.length > 1) {
      this.displayErrorMessage({
        message: 'ADDDATA.FILE.zipFileCannotBeUploaded',
      });
      isValid = false;
    }
    if (zipFilesCount > 1) {
      isValid = false;
      this.displayErrorMessage({message: 'ADDDATA.FILE.onlyOneZipFileCan'});
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
   * @param overwrite - (Optional) Overwrite existing layman layer
   * @returns
   */
  async loadNonWmsLayer(
    endpoint: HsEndpoint,
    formDataParams: FileFormData,
    overwrite?: boolean,
  ): Promise<PostPatchLayerResponse> {
    try {
      const formData = await this.constructFormData(endpoint, formDataParams);
      const asyncUpload: AsyncUpload =
        this.hsLaymanService.prepareAsyncUpload(formData);
      this.asyncLoading = asyncUpload.async;

      const res = await this.hsLaymanService.tryLoadLayer(
        endpoint,
        formData,
        asyncUpload,
        formDataParams.name,
        overwrite,
      );
      return res;
    } catch (err) {
      this.readingData = false;
      throw err;
    }
  }

  /**
   * Try to find layer in Layman's database using Layman friendly layer name
   * @param name - Layman friendly layer name to search by
   */
  async lookupLaymanLayer(name: string): Promise<boolean> {
    const friendlyName = getLaymanFriendlyLayerName(name);
    let descriptor: HsLaymanLayerDescriptor;
    if (this.isAuthenticated()) {
      this.pickEndpoint();
      try {
        descriptor = await this.hsLaymanService.describeLayer(
          this.endpoint,
          name,
          this.endpoint.user,
          true,
        );
      } catch (error) {
        this.hsLog.error(error);
        throw error;
      }
    }
    if (!descriptor || descriptor?.name != friendlyName) {
      return false;
    } else {
      return true;
    }
  }

  /**
   * Convert value from one range to another
   * @param value - value to convert
   * @param oldRange - min, max of values range
   * @param newRange - min, max of values range. Default to 0 - 1
   */
  convertRange(
    value: number,
    oldRange: {min: number; max: number},
    newRange = {min: 0, max: 1},
  ): number {
    return (
      ((value - oldRange.min) * (newRange.max - newRange.min)) /
        (oldRange.max - oldRange.min) +
      newRange.min
    );
  }

  /**
   * Calculates progress of individual file being zipped by transforming value into 0 - 1 scale
   */
  calculateFileProgress(value, nrOfFiles): number {
    const unit = 100 / nrOfFiles;
    const breakpoints = new Array(nrOfFiles).fill(unit);
    //Get breakpoints eg. [33,66,99] for nrOfFiles = 3
    for (const [index, item] of breakpoints.entries()) {
      if (breakpoints[index - 1]) {
        breakpoints[index] = item + breakpoints[index - 1];
      }
    }
    const rangeMaxIdx = breakpoints.findIndex((b) => value < b);
    const newRangeMax = breakpoints[rangeMaxIdx];
    const newRangeMin = breakpoints[rangeMaxIdx - 1]
      ? breakpoints[rangeMaxIdx - 1]
      : 0;

    return this.convertRange(value, {min: newRangeMin, max: newRangeMax});
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
   * @returns FormData object for HTTP request
   */
  async constructFormData(
    endpoint: HsEndpoint,
    formDataParams: FileFormData,
  ): Promise<FormData> {
    this.readingData = true;
    const {files, name, abstract, srs, access_rights, timeRegex} =
      formDataParams;
    const sld = formDataParams.serializedStyle;
    const formData = new FormData();
    let zipFile;
    const zip = new JSZip();
    if (this.isZip(files[0].type)) {
      zipFile = new Blob([files[0].content], {type: files[0].type});
    } else {
      files.forEach((file) => {
        zip.file(file.name, file.content);
      });
      zipFile = await zip.generateAsync(
        {type: 'blob', streamFiles: true},
        (metadata) => {
          setTimeout(() => {
            this.hsLaymanService.totalProgress = this.calculateFileProgress(
              metadata.percent,
              files.length,
            );
          }, 0);
        },
      );
    }
    formData.append('file', zipFile, files[0].name.split('.')[0] + '.zip');
    if (sld) {
      formData.append(
        'sld',
        new Blob([sld.content], {type: sld.type}),
        sld.name,
      );
    }
    if (timeRegex) {
      formData.append('time_regex', timeRegex);
    }
    formData.append('name', name);
    const title = formDataParams.title == '' ? name : formDataParams.title;
    formData.append('title', title);
    formData.append('abstract', abstract);
    formData.append('crs', srs);

    const rights = this.hsLaymanService.parseAccessRightsForLayman(
      endpoint,
      access_rights,
    );

    formData.append('access_rights.write', rights.write);
    formData.append('access_rights.read', rights.read);
    this.readingData = false;
    return formData;
  }

  /**
   * Handler for button click to send file to layman and wait for
   * answer with wms service url to add to map
   * @param data - Current data object for upload
   * @param options - (Optional) overwrite: Overwrite existing layman layer, repetive: Called for more than one time
   */
  async addAsService(
    data: FileDataObject,
    options?: {
      overwrite?: boolean;
      repetive?: boolean;
    },
  ): Promise<void> {
    let exists: boolean;
    try {
      this.loadingToLayman = true;
      if (!this.endpoint) {
        this.pickEndpoint();
      }
      if (!this.isSRSSupported(data)) {
        throw new Error(
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'ADDLAYERS.ERROR',
            'srsNotSupported',
            undefined,
          ),
        );
      }
      if (!options?.overwrite) {
        exists = await this.lookupLaymanLayer(data.name);
      }
      if (exists) {
        this.callOverwriteDialog(data, options?.repetive);
      } else {
        const response = await this.loadNonWmsLayer(
          this.endpoint,
          {
            files: data.files,
            name: data.name,
            title: data.title,
            abstract: data.abstract,
            srs: data.srs,
            serializedStyle: data.serializedStyle,
            access_rights: data.access_rights,
            timeRegex: data.timeRegex,
          },
          options?.overwrite,
        );
        if (response?.code) {
          await this.loadNonWmsError(response, data, options?.repetive);
        } else {
          await this.loadNonWmsSuccess(response, data);
        }
      }
    } catch (err) {
      this.displayErrorMessage({message: err.message, details: null});
    }
  }

  /**
   * Load overwrite layer dialog
   * @param data - Current data object for upload
   */
  async loadOverwriteLayerDialog(
    data: FileDataObject | VectorDataObject,
    repetive?: boolean,
  ): Promise<OverwriteResponse> {
    const dialogRef = this.hsDialogContainerService.create(
      HsLayerOverwriteDialogComponent,
      {
        dataObj: data,
        repetive,
      },
    );
    return await dialogRef.waitResult();
  }

  /**
   * Call for overwrite dialog
   * @param data - Current data object to load
   * @param repetive - Called for more the one time
   */
  async callOverwriteDialog(
    data: FileDataObject,
    repetive?: boolean,
  ): Promise<OverwriteResponse> {
    const result = await this.loadOverwriteLayerDialog(data, repetive);
    switch (result) {
      case OverwriteResponse.add:
        this.addAsService(data, {repetive: true});
        break;
      case OverwriteResponse.overwrite:
        this.addAsService(data, {overwrite: true});
        break;
      case OverwriteResponse.cancel:
      default:
        this.loadingToLayman = false;
        return;
    }
  }

  /**
   * Process error server response after trying to load non-wms layer
   * @param response - Http post/past response after loading layer to Layman
   * @param data - Current data object to load
   */
  async loadNonWmsError(
    response: PostPatchLayerResponse,
    data: FileDataObject,
    repetive?: boolean,
  ): Promise<void> {
    if (response.code == 17) {
      this.callOverwriteDialog(data, repetive);
    } else {
      this.handleLaymanError(response);
    }
  }

  /**
   * Process success server response after trying to load non-wms layer
   * @param response - Http post/past response after loading layer to Layman
   */
  handleLaymanError(response: PostPatchLayerResponse): void {
    const errorMessage =
      response?.error?.message ?? response?.message == 'Wrong parameter value'
        ? `${response?.message} : ${response?.detail.parameter}`
        : response?.message;
    const errorDetails = response?.detail?.missing_extensions
      ? Object.values(response.detail?.missing_extensions)
      : [];
    this.displayErrorMessage({message: errorMessage, details: errorDetails});
  }
  /**
   * Process success server response after trying to load non-wms layer
   * @param response - HTTP POST/PATCH response after loading layer to Layman
   * @param data - Current data object to load
   */
  async loadNonWmsSuccess(
    response: PostPatchLayerResponse,
    data: FileDataObject,
  ): Promise<void> {
    data.name = response.name; //Name translated to Layman-safe name
    const descriptor = await this.describeNewLayer(
      this.endpoint,
      response.name,
      ['wms', 'style'],
    );
    if (descriptor?.file.error) {
      const error = descriptor.file.error;
      const msg = error?.detail.message ?? error.message;
      this.hsToastService.createToastPopupMessage(
        this.hsLanguageService.getTranslation(
          'ADDLAYERS.ERROR.someErrorHappened',
          undefined,
        ),
        this.hsLanguageService.getTranslationIgnoreNonExisting(
          'LAYMAN.ERROR',
          msg ?? descriptor.file.error.code.toString(),
          undefined,
        ),
        {
          serviceCalledFrom: 'HsAddDataCommonFileService',
          disableLocalization: true,
        },
      );
      this.layerAddedAsService.next(false);
      return;
    }
    this.hsLaymanService.totalProgress = 0;
    this.hsAddDataService.selectType('url');
    this.layerAddedAsService.next(true);
    const serviceType = data.loadAsType ?? 'wms';
    await this.hsAddDataOwsService.connectToOWS({
      type: serviceType,
      uri: descriptor[serviceType].url,
      layer:
        serviceType === 'wms'
          ? data.name
          : `${descriptor.workspace}:${data.name}`,
      owrCache: true,
      layerOptions: {
        style: data.serializedStyle
          ? await this.hsCommonLaymanService.getStyleFromUrl(
              descriptor.style.url,
            )
          : undefined,
      },
    });
  }

  /**
   * @param endpoint - Selected endpoint (should be Layman)
   * @param layerName - Name of the layer to describe
   * @param pendingParam - (Optional) Param of descriptor that needs to pass PENDING and STARTING status
   * before returning. By default set to 'wms'
   * @returns Description of Layman layer
   */
  async describeNewLayer(
    endpoint: HsEndpoint,
    layerName: string,
    pendingParams: string[] = ['wms'],
  ): Promise<HsLaymanLayerDescriptor> {
    try {
      const descriptor = await this.hsLaymanService.describeLayer(
        endpoint,
        layerName,
        endpoint.user,
      );
      if (
        pendingParams.some((param) =>
          layerParamPendingOrStarting(descriptor, param),
        )
      ) {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(this.describeNewLayer(endpoint, layerName, pendingParams));
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
   * Display error message toast, when called and broadcast event about a failed attempt to load wms layer
   * @param _options - Error message options: message, header or details
   */
  displayErrorMessage(_options: errorMessageOptions = {}): void {
    this.hsToastService.createToastPopupMessage(
      _options?.header ?? this.fileUploadErrorHeader,
      _options.message,
      {
        serviceCalledFrom: 'HsAddDataCommonFileService',
        details: _options?.details,
      },
    );
    this.layerAddedAsService.next(false);
  }

  /**
   * Check if srs from data is supported by Layman
   * @param data - Current data object to load
   * @returns True, if srs is supported, false otherwise
   */
  isSRSSupported(data: FileDataObject): boolean {
    return this.hsLaymanService.supportedCRRList.some((epsg) =>
      data.srs.endsWith(epsg),
    );
  }

  /**
   * Check if user is authorized as Layman user
   * @returns True, if user is authorized, false otherwise
   */
  isAuthenticated(): boolean {
    return this.hsCommonLaymanService.layman?.authenticated ?? false;
  }

  /**
   * Set data object name based on uploaded files
   * @param data - Current data object to load
   */
  setDataName(data: FileDataObject): void {
    data.name = data.files[0].name.slice(0, -4);
    data.title = data.name;
    this.dataObjectChanged.next(data);
  }
}
