import {HttpClient, HttpHeaders} from '@angular/common/http';
import {computed, Injectable} from '@angular/core';

import Resumable from 'resumablejs';
import {
  Observable,
  Subject,
  Subscription,
  catchError,
  forkJoin,
  lastValueFrom,
  map,
  of,
} from 'rxjs';

import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {GeoJSONFeatureCollection} from 'ol/format/GeoJSON';
import {Geometry} from 'ol/geom';
import {Layer, Vector as VectorLayer} from 'ol/layer';
import {Source, Vector as VectorSource} from 'ol/source';

import {
  AccessRightsModel,
  AsyncUpload,
  CompoData,
  HsLaymanLayerDescriptor,
  MapComposition,
  UpsertLayerObject,
  WfsSyncParams,
} from 'hslayers-ng/types';
import {
  DeleteAllLayersResponse,
  DeleteSingleLayerResponse,
  HsCommonLaymanService,
  PREFER_RESUMABLE_SIZE_LIMIT,
  SUPPORTED_SRS_LIST,
  getLayerName,
  getLaymanFriendlyLayerName,
  getSupportedSrsList,
  layerParamPendingOrStarting,
  wfsFailed,
  wfsNotAvailable,
  PostPatchLayerResponse,
} from 'hslayers-ng/common/layman';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaverService} from './saver-service.interface';
import {HsToastService} from 'hslayers-ng/common/toast';
import {
  createGetFeatureRequest,
  createPostFeatureRequest,
} from 'hslayers-ng/common/layers';
import {
  getAccessRights,
  getLaymanLayerDescriptor,
  getQml,
  getSld,
  getTitle,
  getWorkspace,
  setHsLaymanSynchronizing,
  setLaymanLayerDescriptor,
} from 'hslayers-ng/common/extensions';
import {normalizeSldComparisonOperators} from 'hslayers-ng/services/utils';

@Injectable({
  providedIn: 'root',
})
export class HsLaymanService implements HsSaverService {
  crs: string;
  pendingLayers: Array<string> = [];
  laymanLayerPending: Subject<string[]> = new Subject();
  totalProgress = 0;
  deleteQuery: Subscription;
  supportedCRRList = computed(() => {
    const laymanEP = this.hsCommonLaymanService.layman();
    if (laymanEP) {
      return getSupportedSrsList(laymanEP);
    }
    return SUPPORTED_SRS_LIST;
  });

  pendingRequests: Map<string, Promise<HsLaymanLayerDescriptor>> = new Map();
  constructor(
    private http: HttpClient,
    private hsMapService: HsMapService,
    private hsLogService: HsLogService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsCommonLaymanService: HsCommonLaymanService,
  ) {}

  /**
   * Update composition's access rights
   * @param compName - Composition's name
   * @param endpoint - Endpoint's description
   * @param access_rights - Composition's new access rights
   * @returns Promise result of composition's PATCH request
   */
  async updateCompositionAccessRights(
    compName: string,
    access_rights: AccessRightsModel,
  ): Promise<any> {
    const rights = this.parseAccessRightsForLayman(access_rights);
    const formdata = new FormData();
    formdata.append('name', compName);
    formdata.append('access_rights.read', rights.read);
    formdata.append('access_rights.write', rights.write);
    return await this.makeMapPostPatchRequest(
      this.hsCommonLaymanService.user(),
      compName,
      formdata,
      false,
    );
  }
  /**
   * Save composition to Layman's database
   * @param compositionJson - Json with composition's definition
   * @param compoData - Additional data for composition
   * @param saveAsNew - Save as new composition
   * @returns Promise result of POST
   */
  async save(
    compositionJson: MapComposition,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any> {
    const rights = this.parseAccessRightsForLayman(compoData.access_rights);
    const formdata = new FormData();
    formdata.append(
      'file',
      new Blob([JSON.stringify(compositionJson)], {
        type: 'application/json',
      }),
      'blob.json',
    );
    formdata.append('name', compoData.name);
    formdata.append('abstract', compoData.abstract);
    formdata.append('access_rights.read', rights.read);
    formdata.append('access_rights.write', rights.write);

    const user = this.hsCommonLaymanService.user();
    const workspace =
      compoData.workspace === user
        ? user
        : saveAsNew
          ? user
          : compoData.workspace;

    return await this.makeMapPostPatchRequest(
      workspace,
      compoData.name,
      formdata,
      saveAsNew,
      compositionJson,
    );
  }

  /**
   * Save composition to Layman's database
   * @param endpoint - Endpoint's description
   * @param access_rights - Provided access rights
   * @returns Access rights object as two strings, one for read access and the other for write access
   */
  parseAccessRightsForLayman(access_rights: AccessRightsModel): {
    write: string;
    read: string;
  } {
    const user = this.hsCommonLaymanService.user();
    const write =
      access_rights['access_rights.write'] == 'private'
        ? user
        : access_rights['access_rights.write'];
    const read =
      access_rights['access_rights.read'] == 'private'
        ? user
        : access_rights['access_rights.read'];
    return {write, read};
  }

  /**
   * Save composition to Layman's database
   * @param endpoint - Endpoint's description
   * @param workspace - Current Layman's workspace
   * @param mapName - Map composition's name
   * @param formdata - FormData object used for sending data over HTTP request
   * @param saveAsNew - Save as new composition
   * @param compositionJson - JSON with composition's definition
   * @returns Promise result of POST/PATCH request
   */
  async makeMapPostPatchRequest(
    workspace: string,
    mapName: string,
    formdata: FormData,
    saveAsNew: boolean,
    compositionJson?: MapComposition,
  ): Promise<any> {
    const headers = new HttpHeaders();
    headers.append('Content-Type', null);
    headers.append('Accept', 'application/json');
    try {
      let response: any;
      let success = false;
      //Need safety against infinite loop when fixing errors and retrying
      let amendmentsApplied = false;
      //If at First You Don't Succeed, Try, Try Again
      while (!success) {
        const options = {
          headers: headers,
          withCredentials: true,
        };
        const endpoint = this.hsCommonLaymanService.layman();
        response = await lastValueFrom(
          this.http[saveAsNew ? 'post' : 'patch'](
            `${endpoint.url}/rest/workspaces/${workspace}/maps${
              saveAsNew ? `?${Math.random()}` : `/${mapName}`
            }`,
            formdata,
            options,
          ),
        ).catch((err) => {
          this.hsToastService.createToastPopupMessage(
            this.hsLanguageService.getTranslation(
              'COMMON.setPermissionsError',
              undefined,
            ),
            this.hsLanguageService.getTranslationIgnoreNonExisting(
              'COMMON',
              'somethingWentWrong',
            ),
            {serviceCalledFrom: 'HsLaymanService'},
          );
          return err;
        });
        //Unsuccessful request response contains code, detail and message properties
        if (!response.code) {
          success = true;
        } else {
          if (amendmentsApplied) {
            break;
          }
          if (compositionJson) {
            featuresTypeFallback(response, compositionJson);
          }
          amendmentsApplied = true;
        }
      }
      return response;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Send layer's definition and features to Layman
   * @param endpoint - Endpoint's description
   * @param geojson - Geojson's object with features to send to server
   * @param description - Object containing \{name, title, crs, workspace, access_rights\} of
   * layer to retrieve
   * @returns Promise result of POST/PATCH
   */
  async makeUpsertLayerRequest(
    geojson: GeoJSONFeatureCollection,
    description: UpsertLayerObject,
  ): Promise<PostPatchLayerResponse> {
    const formData = new FormData();
    let asyncUpload: AsyncUpload;
    if (geojson) {
      formData.append(
        'file',
        new Blob([JSON.stringify(geojson)], {type: 'application/geo+json'}),
        'blob.geojson',
      );
      asyncUpload = this.prepareAsyncUpload(formData);
    }

    //Empty blob causes Layman to return "Internal Server Error"
    if (description.style) {
      formData.append(
        'sld',
        new Blob([description.style], {type: 'application/octet-stream'}),
        'file.sld',
      );
    }

    formData.append('name', description.name);
    formData.append('title', description.title);
    //https://github.com/LayerManager/layman/commit/48f2cb2e68a906e050c2309f2d6087e3340da0ba
    if (description.crs && geojson) {
      formData.append('crs', description.crs);
    }
    if (description.access_rights) {
      const rights = this.parseAccessRightsForLayman(description.access_rights);

      formData.append('access_rights.write', rights.write);
      formData.append('access_rights.read', rights.read);
    }

    try {
      let layerDesc;
      try {
        layerDesc = await this.describeLayer(
          description.name,
          description.workspace,
        );
      } catch (ex) {
        this.hsLogService.log(`Creating layer ${description.name}`);
      }
      const exists = !!layerDesc?.name;
      const res = await this.tryLoadLayer(
        formData,
        asyncUpload,
        layerDesc?.name ? description.name : '',
        exists,
      );
      return res;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Try to load layer to Layman's server
   * @param formData - A set of key/value pairs representing layer fields and values, for HTTP request
   * @param asyncUpload - Async upload data: Async upload state and files to upload
   * @param layerName - Existing layer's name
   * @param overwrite - (Optional) Should overwrite existing layer
   * @returns Promise result of POST/PATCH
   */
  async tryLoadLayer(
    formData: FormData,
    asyncUpload: AsyncUpload,
    layerName: string,
    overwrite?: boolean,
  ): Promise<PostPatchLayerResponse> {
    layerName = getLaymanFriendlyLayerName(layerName);
    try {
      const postOrPatch = overwrite ? 'patch' : 'post';
      const workspace = this.hsCommonLaymanService.user();
      const endpoint = this.hsCommonLaymanService.layman();
      const url = `${endpoint.url}/rest/workspaces/${workspace}/layers${
        overwrite ? `/${layerName}` : `?${Math.random()}`
      }`;
      let data: PostPatchLayerResponse = await lastValueFrom(
        this.http[postOrPatch](url, formData, {
          observe: 'body',
          responseType: 'json',
          withCredentials: true,
        }),
      ).catch((err) => {
        this.hsToastService.createToastPopupMessage(
          this.hsLanguageService.getTranslation(
            'COMMON.setPermissionsError',
            undefined,
          ),
          this.hsLanguageService.getTranslationIgnoreNonExisting(
            'COMMON',
            'somethingWentWrong',
          ),
          {serviceCalledFrom: 'HsLaymanService'},
        );
        return err;
      });
      data = Array.isArray(data) ? data[0] : data;
      //CHECK IF OK not auth etc.
      if (data && !data.code) {
        if (asyncUpload?.async) {
          const promise = await this.asyncUpload(
            asyncUpload.filesToAsyncUpload,
            data,
          );
          return promise;
        }
        return data;
      }
      return data;
    } catch (error) {
      this.hsLogService.error(error);
    }
  }

  /**
   * Prepare files for async upload if needed
   * @param formData - FormData object for HTTP request
   * @returns File array for async upload
   */
  prepareAsyncUpload(formData: FormData): AsyncUpload {
    const asyncUpload: AsyncUpload = {filesToAsyncUpload: []};
    const sumFileSize = formData
      .getAll('file')
      .filter((f) => (f as File).name)
      .reduce((prev, f) => prev + (f as File).size, 0);
    const async_upload = sumFileSize >= PREFER_RESUMABLE_SIZE_LIMIT;
    if (async_upload) {
      asyncUpload.async = async_upload;
      this.switchFormDataToFileNames(formData, asyncUpload.filesToAsyncUpload);
    }
    return asyncUpload;
  }

  /**
   * Saves files for later upload and switches from files to file names in form data
   * @param formdata - File that will be uploaded
   * @param files_to_async_upload - File array that will get uploaded asynchronously
   */
  switchFormDataToFileNames(
    formdata: FormData,
    files_to_async_upload: File[],
  ): void {
    const files = formdata.getAll('file').filter((f) => (f as any).name);
    files_to_async_upload.push(...(files as File[]));

    const file_names = files.map((f) => (f as any).name);
    formdata.delete('file');
    file_names.forEach((fn) => formdata.append('file', fn));
  }

  /**
   * Use resumable to chunk upload data larger than PREFER_RESUMABLE_SIZE_LIMIT(2MB)
   * @param files_to_async_upload - File array that will get uploaded asynchronously
   * @param data - Layman's response after posting layer
   */
  asyncUpload(
    files_to_async_upload: File[],
    data: PostPatchLayerResponse,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      files_to_async_upload = files_to_async_upload.filter(
        (file_to_upload) =>
          !!data['files_to_upload'].find(
            (expected_file) => file_to_upload.name === expected_file.file,
          ),
      );
      const layername = data['name'];
      const workspace = this.hsCommonLaymanService.user();
      const endpoint = this.hsCommonLaymanService.layman();
      const resumable = new Resumable({
        target: `${endpoint.url}/rest/workspaces/${workspace}/layers/${layername}/chunk`,
        query: {
          'layman_original_parameter': 'file',
        },
        testChunks: false,
        maxFiles: 3,
        withCredentials: true,
      });

      const chunksProgress = [];
      resumable.on('complete', () => {
        this.hsLogService.log(`Async upload finished successfully!`);
        resolve(data);
      });
      resumable.on('fileError', (file, message) => {
        this.hsLogService.log('fileError', message);
        reject(message);
      });
      resumable.on('fileSuccess', (file, message) => {
        this.hsLogService.log(message);
      });
      resumable.on('fileProgress', (file) => {
        chunksProgress[file.uniqueIdentifier] = file.progress(false);
        const sum = Object.values(chunksProgress).reduce((a, b) => a + b);
        this.totalProgress = sum / files_to_async_upload.length;
      });
      resumable.on('filesAdded', (files) => {
        this.hsLogService.log(
          `${files.length} files added to Resumable.js, starting async upload.`,
        );
        resumable.upload();
      });

      // add files to Resumable.js, it will fire 'filesAdded' event
      resumable.addFiles(files_to_async_upload);
    });
  }

  /**
   * Create Layman layer if needed and send all features
   * @param layer - Layer to get Layman friendly name for
   * in order to get features
   * @param withFeatures - Layer state, whether or not it has features
   */
  public async upsertLayer(
    layer: VectorLayer<VectorSource<Feature>>,
    withFeatures: boolean,
  ): Promise<void> {
    if (layer.getSource().loading) {
      return;
    }
    const layerName = getLayerName(layer);
    const layerTitle = getTitle(layer);
    const crsSupported = this.supportedCRRList().includes(this.crs);

    setHsLaymanSynchronizing(layer, true);
    const normalizedSld = normalizeSldComparisonOperators(getSld(layer));
    const data: UpsertLayerObject = {
      title: layerTitle,
      name: layerName,
      crs: crsSupported ? this.crs : 'EPSG:3857',
      workspace: getWorkspace(layer),
      access_rights: getAccessRights(layer),
      style: normalizedSld || getQml(layer),
    };
    await this.makeUpsertLayerRequest(
      this.getFeatureGeoJSON(
        layer.getSource().getFeatures(),
        crsSupported,
        withFeatures,
      ),
      data,
    );
    setTimeout(async () => {
      await this.makeGetLayerRequest(layer);
      setHsLaymanSynchronizing(layer, false);
    }, 2000);
  }

  /**
   * Converts OL Feature objects into a GeoJSON
   * @param features - Array of OL Features
   * @param crsSupported - True if current CRS is supported by Layman
   * @param withFeatures FIXME: What is this good for?
   * @returns GeoJSON representation of the input features
   */
  getFeatureGeoJSON(
    features: Feature<Geometry>[],
    crsSupported: boolean,
    withFeatures: boolean,
  ) {
    const f = new GeoJSON();
    let geojson: GeoJSONFeatureCollection;
    if (!withFeatures) {
      return;
    }
    if (!crsSupported) {
      geojson = f.writeFeaturesObject(
        features.map((f) => {
          const f2 = f.clone();
          f2.getGeometry().transform(this.crs, 'EPSG:3857');
          return f2;
        }),
      );
    } else {
      geojson = f.writeFeaturesObject(features);
    }
    return geojson;
  }

  /**
   * Sync WFS features using transaction. Publish layer first if needed
   * @param param0 - Object describing endpoint, layer and arrays
   * for each of the methods: update, del, insert containing the features to be processed
   * @param add - Features being added
   * @param upd - Features being uploaded
   * @param del - Features being deleted
   * @param layer - Layer interacted with
   * @returns Promise result of POST
   */
  async sync({add, upd, del, layer}: WfsSyncParams): Promise<string> {
    try {
      let desc = getLaymanLayerDescriptor(layer);
      const name = getLayerName(layer);
      try {
        if (!desc) {
          desc = await this.describeLayer(name, getWorkspace(layer));
          this.cacheLaymanDescriptor(layer, desc);
        }
        if (desc.name == undefined || desc.wfs.url == undefined) {
          throw `Layer or its name/url didn't exist`;
        }
      } catch (ex) {
        this.hsLogService.warn(`Layer ${name} didn't exist. Creating..`);
        this.upsertLayer(layer, true);
        return;
      }
      desc.wfs.url = desc.wfs.url;
      return this.makeWfsRequest({add, upd, del, layer}, desc.wfs.url);
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * Get feature type (layer identifiactor) l_<uuid>
   * from changes array (add, upd, or del ) or layer
   */
  private getFeatureType(
    add: Feature[],
    upd: Feature[],
    del: Feature[],
    layer: VectorLayer<VectorSource<Feature>>,
  ) {
    const feature = add?.[0] ?? upd?.[0] ?? del?.[0];
    const featureId = feature?.getId() as string;
    if (featureId !== undefined && featureId !== null) {
      return featureId.split('.')[0];
    }
    if (feature) {
      this.hsLogService.warn(
        'First feature found has no ID. Falling back to layer name for featureType.',
      );
    }
    return `l_${getLaymanLayerDescriptor(layer).uuid}`;
  }

  /**
   * Make WFS transaction request
   * @param param0 - Object describing endpoint, layer and arrays
   * for each of the methods: update, del, insert containing the features to be processed
   * @param add - Features being added
   * @param upd - Features being uploaded
   * @param del - Features being deleted
   * @param layer - Layer interacted with
   * @returns Promise result of POST
   */
  private async makeWfsRequest(
    {add, upd, del, layer}: WfsSyncParams,
    url: string,
  ): Promise<string> {
    try {
      const srsName = this.hsMapService.getCurrentProj().getCode();
      const featureType = this.getFeatureType(add, upd, del, layer);

      const {default: WFS} = await import('ol/format/WFS');
      const wfsFormat = new WFS();
      const options = {
        featureNS: 'http://layman',
        featurePrefix: 'layman',
        featureType: String(featureType), // Ensure featureType is a string for WFS options
        srsName,
        nativeElements: null,
      };
      const featureNode: any = wfsFormat.writeTransaction(
        add,
        upd,
        del,
        options,
      );
      const headers = new HttpHeaders();
      headers.append('Content-Type', 'application/xml');
      headers.append('Accept', 'application/xml');
      const httpOptions: any = {
        headers,
        responseType: 'text',
        withCredentials: true,
      };
      const body = featureNode.outerHTML
        .replace(/<geometry>/gm, '<wkb_geometry>')
        .replace(/<\/geometry>/gm, '</wkb_geometry>');
      const r: any = await lastValueFrom(
        this.http.post(url, body, httpOptions),
      );
      return r;
    } catch (ex) {
      this.hsLogService.error(ex);
    }
  }

  /**
   * Cache Layman's layer descriptor so it can be used later on
   * @param layer - Layer interacted with
   * @param layer - Layman's layer descriptor
   */
  private cacheLaymanDescriptor(
    layer: VectorLayer<VectorSource<Feature>>,
    desc: HsLaymanLayerDescriptor,
  ): void {
    if (this.hsCommonLaymanService.user() != 'browser') {
      setLaymanLayerDescriptor(layer, desc);
    }
  }

  /**
   * Retrieve layer's features from server
   * @param layer - Layer interacted with
   * @returns Promise with WFS xml (GML3.1) response
   * with features for a specified layer
   */
  async makeGetLayerRequest(
    layer: VectorLayer<VectorSource<Feature>>,
  ): Promise<string> {
    let desc: HsLaymanLayerDescriptor;
    const layerName = getLayerName(layer);
    try {
      desc = await this.describeLayer(layerName, getWorkspace(layer));
      if (
        desc === null || //In case of response?.code == 15 || 32
        (desc.wfs.status == desc.wms.status && wfsNotAvailable(desc))
      ) {
        return null;
      }
      if (desc?.name && !wfsNotAvailable(desc)) {
        this.cacheLaymanDescriptor(layer, desc);
      }
    } catch (ex) {
      //If Layman returned 404
      return null;
    }

    try {
      const requestOptions = await this.buildLayerRequestOptions(layer, desc);
      const response = await lastValueFrom(
        this.http.post(desc.wfs.url, requestOptions.body, {
          responseType: 'text',
          withCredentials: true,
          headers: requestOptions.headers,
        }),
      );
      return response;
    } catch (ex) {
      this.hsLogService.error('Error in makeGetLayerRequest:', ex);
      return null;
    }
  }

  /**
   * Builds request options for Layman's WFS request
   */
  private async buildLayerRequestOptions(
    layer: VectorLayer<VectorSource<Feature>>,
    desc: HsLaymanLayerDescriptor,
  ): Promise<{body: string; headers?: {[key: string]: string}}> {
    const source = layer.getSource();
    const filter: string = source.get('filter');
    const srsName = this.hsMapService.getCurrentProj().getCode();
    const workspace = getWorkspace(layer);
    const laymanUuid = `l_${desc.uuid}`;

    let body: string;
    if (filter) {
      body = await createPostFeatureRequest(
        laymanUuid,
        '2.0.0',
        srsName,
        workspace,
        'GML32',
        undefined,
        srsName,
        filter,
        source.get('geometryAttribute'),
      );
    } else {
      body = createGetFeatureRequest(
        laymanUuid,
        '2.0.0',
        srsName,
        'GML32',
        undefined,
        srsName,
      );
    }

    const headers = filter
      ? undefined
      : {'Content-Type': 'application/x-www-form-urlencoded'};

    return {body, headers};
  }

  /**
   * Try getting layer's description from Layman. Subsequent request with same parameters
   * are reused.
   * @param layerName - Interacted layer's name
   * @param workspace - Current Layman's workspace
   * @returns Promise which returns layers
   * description containing name, file, WMS, WFS urls etc.
   */
  async describeLayer(
    layerName: string,
    workspace: string,
    ignoreStatus?: boolean,
  ): Promise<HsLaymanLayerDescriptor> {
    const requestKey = `${workspace}/${layerName}`;

    // Check if there's a pending request with the same parameters
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }
    const desc = this.makeDescribeLayerRequest(
      layerName,
      workspace,
      ignoreStatus,
    );
    // Store the promise for the request
    this.pendingRequests.set(requestKey, desc);
    return desc;
  }

  /**
   * Try getting layer's description from Layman.
   */
  private async makeDescribeLayerRequest(
    layerName: string,
    workspace: string,
    ignoreStatus?: boolean,
  ): Promise<HsLaymanLayerDescriptor> {
    const requestKey = `${workspace}/${layerName}`;
    try {
      layerName = getLaymanFriendlyLayerName(layerName); //Better safe than sorry
      const endpoint = this.hsCommonLaymanService.layman();
      const response: HsLaymanLayerDescriptor = await lastValueFrom(
        this.http
          .get(
            `${
              endpoint.url
            }/rest/workspaces/${workspace}/layers/${layerName}?${Math.random()}`,
            {
              withCredentials: true,
            },
          )
          .pipe(
            catchError((e) => {
              //Layer not found
              if (e?.error.code == 15) {
                return of(e?.error);
              }
              throw e;
            }),
          ),
      );
      switch (true) {
        case response?.code == 15 || wfsFailed(response):
          this.deletePendingDescribeRequest(requestKey, 0);
          return null;
        case response.name && ignoreStatus:
          this.deletePendingDescribeRequest(requestKey, 1000);
          return {...response, workspace};
        case response.wfs &&
          (layerParamPendingOrStarting(response, 'wfs') ||
            response.wfs?.url == undefined):
          if (!this.pendingLayers.includes(layerName)) {
            this.pendingLayers.push(layerName);
            this.laymanLayerPending.next(this.pendingLayers);
          }
          await new Promise((resolve) => setTimeout(resolve, 310));
          return this.makeDescribeLayerRequest(layerName, workspace);
        default:
          if (response.name) {
            this.deletePendingDescribeRequest(requestKey, 1000);
            this.managePendingLayers(layerName);
            return {...response, workspace};
          }
      }
    } catch (ex) {
      this.managePendingLayers(layerName);
      this.hsLogService.error(ex);
      throw ex;
    }
  }

  private deletePendingDescribeRequest(key: string, timeout: number = 0) {
    setTimeout(() => {
      this.pendingRequests.delete(key);
    }, timeout);
  }

  /**
   * Keep track of pending layers that are still being loaded
   * @param layerName - Interacted layer's name
   */
  private managePendingLayers(layerName: string): void {
    if (this.pendingLayers.includes(layerName)) {
      this.pendingLayers = this.pendingLayers.filter(
        (layer) => layer != layerName,
      );
      this.laymanLayerPending.next(this.pendingLayers);
    }
  }

  /**
   * Removes selected layer from Layman's database
   * @param layer - (Optional) Layer to be removed. DELETE all layers when not provided
   */
  async removeLayer(layer?: Layer<Source> | string): Promise<boolean> {
    let success: boolean;
    return new Promise((resolve, reject): void => {
      if (this.deleteQuery) {
        this.deleteQuery.unsubscribe();
        delete this.deleteQuery;
      }
      const observables: Observable<any>[] = [];

      const ds = this.hsCommonLaymanService.layman();
      const workspace = this.hsCommonLaymanService.user();
      let url;
      if (layer) {
        const layerName =
          typeof layer == 'string' ? layer : getLayerName(layer);
        url = `${ds.url}/rest/workspaces/${workspace}/layers/${layerName}`;
      } else {
        url = `${ds.url}/rest/workspaces/${workspace}/layers`;
      }

      const response = this.http
        .delete(url, {
          withCredentials: true,
        })
        .pipe(
          map((res: DeleteSingleLayerResponse | DeleteAllLayersResponse[]) => {
            const response = Array.isArray(res) ? res[0] : res;
            if (response?.code) {
              this.hsCommonLaymanService.displayLaymanError(
                ds,
                'LAYMAN.deleteLayersRequest',
                response,
              );
              success = false;
            } else {
              let message = 'LAYMAN.layerSuccessfullyRemoved';
              if (!layer) {
                message = 'LAYMAN.allLayersSuccessfullyRemoved';
              }
              const details = Array.isArray(res)
                ? res.map((item) => item.name)
                : [res.name];
              this.hsToastService.createToastPopupMessage(
                'LAYMAN.deleteLayersRequest',
                message,
                {
                  type: 'success',
                  details,
                },
              );
              success = true;
            }
          }),
          catchError((e) => {
            this.hsToastService.createToastPopupMessage(
              this.hsLanguageService.getTranslation(
                'LAYMAN.deleteLayersRequest',
                undefined,
              ),
              this.hsLanguageService.getTranslationIgnoreNonExisting(
                'SAVECOMPOSITION',
                'removeLayerError',
                {
                  error: e.error.message ?? e.message,
                  layer:
                    layer instanceof Layer
                      ? (layer as Layer<Source>).get('title')
                      : layer,
                },
              ),
              {serviceCalledFrom: 'HsLaymanService'},
            );
            success = false;
            return of(e);
          }),
        );
      observables.push(response);
      this.deleteQuery = forkJoin(observables).subscribe(() => {
        resolve(success);
      });
    });
  }
}

/**
 * Mend error when features are not encoded as string.
 * They would not need to be encoded in the future, but for now Layman
 * and composition schema requires them to be.
 * @param response - Response containing error about features
 * @param compositionJson  - Composition json being sent on first try
 */
function featuresTypeFallback(
  response: any,
  compositionJson: MapComposition,
): void {
  if (
    response.code == 2 &&
    response.detail &&
    response.detail['validation-errors'] &&
    response.detail['validation-errors'].some((er) =>
      er.message.startsWith("{'type': 'FeatureCollection'"),
    )
  ) {
    for (const layer of compositionJson.layers.filter(
      (l) => l.features && typeof l.features !== 'string',
    )) {
      layer.features = JSON.stringify(layer.features);
    }
  }
}
