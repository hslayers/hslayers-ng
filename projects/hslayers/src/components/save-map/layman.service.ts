import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';

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
import {GeoJSON, WFS} from 'ol/format';
import {GeoJSONFeatureCollection} from 'ol/format/GeoJSON';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';

import {AboutLayman} from './types/about-layman-response.type';
import {AsyncUpload} from './types/async-upload.type';
import {CompoData} from './types/compo-data.type';
import {
  DeleteAllLayersResponse,
  DeleteSingleLayerResponse,
} from '../../common/layman/types/delete-layer-response.type';
import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsCommonLaymanService} from '../../common/layman/layman.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../language/language.service';
import {HsLaymanLayerDescriptor} from './interfaces/layman-layer-descriptor.interface';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaverService} from './interfaces/saver-service.interface';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {MapComposition} from './types/map-composition.type';
import {
  PREFER_RESUMABLE_SIZE_LIMIT,
  SUPPORTED_SRS_LIST,
  getLayerName,
  getLaymanFriendlyLayerName,
  getSupportedSrsList,
  layerParamPendingOrStarting,
  wfsFailed,
  wfsNotAvailable,
} from '../../common/layman/layman-utils';
import {PostPatchLayerResponse} from '../../common/layman/types/post-patch-layer-response.type';
import {UpsertLayerObject} from './types/upsert-layer-object.type';
import {WfsSyncParams} from './types/wfs-sync-params.type';
import {accessRightsModel} from '../add-data/common/access-rights.model';
import {
  getAccessRights,
  getLaymanLayerDescriptor,
  getQml,
  getSld,
  getTitle,
  getWorkspace,
  setHsLaymanSynchronizing,
  setLaymanLayerDescriptor,
} from '../../common/layer-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLaymanService implements HsSaverService {
  crs: string;
  pendingLayers: Array<string> = [];
  laymanLayerPending: Subject<string[]> = new Subject();
  totalProgress = 0;
  deleteQuery: Subscription;
  supportedCRRList: string[] = SUPPORTED_SRS_LIST;
  constructor(
    private hsUtilsService: HsUtilsService,
    private http: HttpClient,
    private hsMapService: HsMapService,
    private hsLogService: HsLogService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsCommonLaymanService: HsCommonLaymanService,
  ) {
    this.hsCommonEndpointsService.endpointsFilled.subscribe(
      async (endpoints) => {
        if (endpoints) {
          const laymanEP = endpoints.find((ep) => ep.type.includes('layman'));
          if (laymanEP) {
            const laymanVersion: AboutLayman = await lastValueFrom(
              this.http
                .get<AboutLayman>(laymanEP.url + '/rest/about/version')
                .pipe(
                  map((res: any) => {
                    return {
                      about: {
                        applications: {
                          layman: {
                            version: res.about.applications.layman.version,
                            releaseTimestamp:
                              res.about.applications.layman[
                                'release-timestamp'
                              ],
                          },
                          laymanTestClient: {
                            version:
                              res.about.applications['layman-test-client']
                                .version,
                          },
                        },
                        data: {
                          layman: {
                            lastSchemaMigration:
                              res.about.applications['last-schema-migration'],
                            lastDataMigration:
                              res.about.applications['last-data-migration'],
                          },
                        },
                      },
                    };
                  }),
                ),
            );
            laymanEP.version = laymanVersion.about.applications.layman.version;
            this.supportedCRRList = getSupportedSrsList(laymanEP);
          }
        }
      },
    );
  }

  /**
   * Update composition's access rights
   * @param compName - Composition's name
   * @param endpoint - Endpoint's description
   * @param access_rights - Composition's new access rights
   * @returns Promise result of composition's PATCH request
   */
  async updateCompositionAccessRights(
    compName: string,
    endpoint: HsEndpoint,
    access_rights: accessRightsModel,
  ): Promise<any> {
    const rights = this.parseAccessRightsForLayman(endpoint, access_rights);
    const formdata = new FormData();
    formdata.append('name', compName);
    formdata.append('access_rights.read', rights.read);
    formdata.append('access_rights.write', rights.write);
    return await this.makeMapPostPatchRequest(
      endpoint,
      endpoint.user,
      compName,
      formdata,
      false,
    );
  }
  /**
   * Save composition to Layman's database
   * @param compositionJson - Json with composition's definition
   * @param endpoint - Endpoint's description
   * @param compoData - Additional data for composition
   * @param saveAsNew - Save as new composition
   * @returns Promise result of POST
   */
  async save(
    compositionJson: MapComposition,
    endpoint: HsEndpoint,
    compoData: CompoData,
    saveAsNew: boolean,
  ): Promise<any> {
    const rights = this.parseAccessRightsForLayman(
      endpoint,
      compoData.access_rights,
    );
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

    const workspace = compoData.workspace
      ? saveAsNew
        ? endpoint.user
        : compoData.workspace
      : endpoint.user;
    return await this.makeMapPostPatchRequest(
      endpoint,
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
  parseAccessRightsForLayman(
    endpoint: HsEndpoint,
    access_rights: accessRightsModel,
  ): {
    write: string;
    read: string;
  } {
    const write =
      access_rights['access_rights.write'] == 'private'
        ? endpoint.user
        : access_rights['access_rights.write'];
    const read =
      access_rights['access_rights.read'] == 'private'
        ? endpoint.user
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
    endpoint: HsEndpoint,
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
    endpoint: HsEndpoint,
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

    //Empty blob causes Layman to return “Internal Server Error”
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
      const rights = this.parseAccessRightsForLayman(
        endpoint,
        description.access_rights,
      );

      formData.append('access_rights.write', rights.write);
      formData.append('access_rights.read', rights.read);
    }

    const headers = new HttpHeaders();
    headers.append('Content-Type', null);
    headers.append('Accept', 'application/json');
    const options = {
      headers: headers,
      withCredentials: true,
    };
    try {
      let layerDesc;
      try {
        layerDesc = await this.describeLayer(
          endpoint,
          description.name,
          description.workspace,
        );
      } catch (ex) {
        this.hsLogService.log(`Creating layer ${description.name}`);
      }
      const exists = layerDesc?.name ? true : false;
      const res = await this.tryLoadLayer(
        endpoint,
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
   * @param endpoint - Endpoint's description
   * @param formData - A set of key/value pairs representing layer fields and values, for HTTP request
   * @param asyncUpload - Async upload data: Async upload state and files to upload
   * @param layerName - Existing layer's name
   * @param overwrite - (Optional) Should overwrite existing layer
   * @returns Promise result of POST/PATCH
   */
  async tryLoadLayer(
    endpoint: HsEndpoint,
    formData: FormData,
    asyncUpload: AsyncUpload,
    layerName: string,

    overwrite?: boolean,
  ): Promise<PostPatchLayerResponse> {
    layerName = getLaymanFriendlyLayerName(layerName);
    try {
      const postOrPatch = overwrite ? 'patch' : 'post';
      const url = `${endpoint.url}/rest/workspaces/${endpoint.user}/layers${
        overwrite ? `/${layerName}` : `?${Math.random()}`
      }`;
      let data = await lastValueFrom(
        this.http[postOrPatch]<PostPatchLayerResponse>(url, formData, {
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
            endpoint,
          );
          return promise;
        } else {
          return data;
        }
      } else {
        return data;
      }
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
   * @param endpoint - Layman's service endpoint
   */
  asyncUpload(
    files_to_async_upload: File[],
    data: PostPatchLayerResponse,
    endpoint: HsEndpoint,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      files_to_async_upload = files_to_async_upload.filter(
        (file_to_upload) =>
          !!data['files_to_upload'].find(
            (expected_file) => file_to_upload.name === expected_file.file,
          ),
      );
      const layername = data['name'];
      const resumable = new Resumable({
        target: `${endpoint.url}/rest/workspaces/${endpoint.user}/layers/${layername}/chunk`,
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
   * @param endpoint - Layman's endpoint description
   * @param layer - Layer to get Layman friendly name for
   * in order to get features
   * @param withFeatures - Layer state, whether or not it has features
   */
  public async upsertLayer(
    endpoint: HsEndpoint,
    layer: VectorLayer<VectorSource<Geometry>>,
    withFeatures: boolean,
  ): Promise<void> {
    if (layer.getSource().loading) {
      return;
    }
    const layerName = getLayerName(layer);
    let layerTitle = getTitle(layer);
    const crsSupported = this.supportedCRRList.includes(this.crs);

    if ((endpoint?.version?.split('.').join() as unknown as number) < 171) {
      layerTitle = getLaymanFriendlyLayerName(layerTitle);
    }
    setHsLaymanSynchronizing(layer, true);
    const data: UpsertLayerObject = {
      title: layerTitle,
      name: layerName,
      crs: crsSupported ? this.crs : 'EPSG:3857',
      workspace: getWorkspace(layer),
      access_rights: getAccessRights(layer),
      style: getSld(layer) || getQml(layer),
    };
    await this.makeUpsertLayerRequest(
      endpoint,
      this.getFeatureGeoJSON(
        layer.getSource().getFeatures(),
        crsSupported,
        withFeatures,
      ),
      data,
    );
    setTimeout(async () => {
      await this.makeGetLayerRequest(endpoint, layer);
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
   * @param ep - Layman's endpoint description
   * @param add - Features being added
   * @param upd - Features being uploaded
   * @param del - Features being deleted
   * @param layer - Layer interacted with
   * @returns Promise result of POST
   */
  async sync({ep, add, upd, del, layer}: WfsSyncParams): Promise<string> {
    /* Clone because endpoint.user can change while the request is processed
    and then description might get cached even if anonymous user was set before.
    Should not cache anonymous layers, because layer can be authorized anytime */
    const endpoint = {...ep};
    try {
      let desc = getLaymanLayerDescriptor(layer);
      const name = getLayerName(layer);
      try {
        if (!desc) {
          desc = await this.describeLayer(endpoint, name, getWorkspace(layer));
          this.cacheLaymanDescriptor(layer, desc, endpoint);
        }
        if (desc.name == undefined || desc.wfs.url == undefined) {
          throw `Layer or its name/url didn't exist`;
        }
      } catch (ex) {
        this.hsLogService.warn(`Layer ${name} didn't exist. Creating..`);
        this.upsertLayer(ep, layer, true);
        return;
      }
      desc.wfs.url = desc.wfs.url;
      return this.makeWfsRequest(
        {ep: endpoint, add, upd, del, layer},
        desc.wfs.url,
      );
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * Make WFS transaction request
   * @param param0 - Object describing endpoint, layer and arrays
   * for each of the methods: update, del, insert containing the features to be processed
   * @param ep - Layman's endpoint description
   * @param add - Features being added
   * @param upd - Features being uploaded
   * @param del - Features being deleted
   * @param layer - Layer interacted with
   * @returns Promise result of POST
   */
  private async makeWfsRequest(
    {ep, add, upd, del, layer}: WfsSyncParams,
    url: string,
  ): Promise<string> {
    try {
      const srsName = this.hsMapService.getCurrentProj().getCode();
      const featureType = getLayerName(layer);
      const wfsFormat = new WFS();
      const options = {
        featureNS: 'http://' + ep.user,
        featurePrefix: ep.user,
        featureType,
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
   * @param endpoint - Layman's endpoint description
   */
  private cacheLaymanDescriptor(
    layer: VectorLayer<VectorSource<Geometry>>,
    desc: HsLaymanLayerDescriptor,
    endpoint: HsEndpoint,
  ): void {
    if (endpoint.user != 'browser') {
      setLaymanLayerDescriptor(layer, desc);
    }
  }

  /**
   * Retrieve layer's features from server
   * @param ep - Layman's endpoint description
   * @param layer - Layer interacted with
   * @returns Promise with WFS xml (GML3.1) response
   * with features for a specified layer
   */
  async makeGetLayerRequest(
    ep: HsEndpoint,
    layer: VectorLayer<VectorSource<Geometry>>,
  ): Promise<string> {
    /* Clone because endpoint.user can change while the request is processed
    and then description might get cached even if anonymous user was set before.
    Should not cache anonymous layers, because layer can be authorized anytime */
    const endpoint = {...ep};
    let desc: HsLaymanLayerDescriptor;
    const layerName = getLayerName(layer);
    try {
      desc = await this.describeLayer(endpoint, layerName, getWorkspace(layer));
      if (
        desc === null || //In case of response?.code == 15 || 32
        (desc.wfs.status == desc.wms.status && wfsNotAvailable(desc))
      ) {
        return null;
      } else if (desc?.name && !wfsNotAvailable(desc)) {
        this.cacheLaymanDescriptor(layer, desc, endpoint);
      }
    } catch (ex) {
      //If Layman returned 404
      return null;
    }

    try {
      /* When OL will support GML3.2, then we can use WFS
        version 2.0.0. Currently only 3.1.1 is possible */
      const response: string = await lastValueFrom(
        this.http.get(
          desc.wfs.url +
            '?' +
            this.hsUtilsService.paramsToURL({
              service: 'wfs',
              version: '1.1.0',
              request: 'GetFeature',
              typeNames: `${getWorkspace(layer)}:${desc.name}`,
              r: Math.random(),
              srsName: this.hsMapService.getCurrentProj().getCode(),
            }),
          {responseType: 'text', withCredentials: true},
        ),
      );
      return response;
    } catch (ex) {
      return null;
    }
  }

  /**
   * Try getting layer's description from Layman.
   * @param endpoint - Layman's endpoint description
   * @param layerName - Interacted layer's name
   * @param workspace - Current Layman's workspace
   * @returns Promise which returns layers
   * description containing name, file, WMS, WFS urls etc.
   */
  async describeLayer(
    endpoint: HsEndpoint,
    layerName: string,
    workspace: string,
    ignoreStatus?: boolean,
  ): Promise<HsLaymanLayerDescriptor> {
    try {
      layerName = getLaymanFriendlyLayerName(layerName); //Better safe than sorry
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
          return null;
        case response.name && ignoreStatus:
          return {...response, workspace};
        case response.wfs &&
          (layerParamPendingOrStarting(response, 'wfs') ||
            response.wfs?.url == undefined):
          if (!this.pendingLayers.includes(layerName)) {
            this.pendingLayers.push(layerName);
            this.laymanLayerPending.next(this.pendingLayers);
          }
          await new Promise((resolve) => setTimeout(resolve, 3500));
          return this.describeLayer(endpoint, layerName, workspace);
        default:
          if (response.name) {
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

      const ds = this.hsCommonLaymanService.layman;
      let url;
      if (layer) {
        const layerName =
          typeof layer == 'string' ? layer : getLayerName(layer);
        url = `${ds.url}/rest/workspaces/${ds.user}/layers/${layerName}`;
      } else {
        url = `${ds.url}/rest/workspaces/${ds.user}/layers`;
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
                  toastStyleClasses: 'bg-success text-light',
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
