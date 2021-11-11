import Resumable from 'resumablejs';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {GeoJSON, WFS} from 'ol/format';
import {Geometry} from 'ol/geom';
import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsEndpoint} from '../../common/endpoints/endpoint.interface';
import {HsLanguageService} from '../language/language.service';
import {HsLaymanLayerDescriptor} from './layman-layer-descriptor.interface';
import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';
import {HsSaverService} from './saver-service.interface';
import {HsToastService} from '../layout/toast/toast.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  PREFER_RESUMABLE_SIZE_LIMIT,
  getLayerName,
  getLaymanFriendlyLayerName,
  wfsFailed,
  wfsNotAvailable,
  wfsPendingOrStarting,
} from './layman-utils';
import {
  getAccessRights,
  getLaymanLayerDescriptor,
  getSld,
  getTitle,
  getWorkspace,
  setHsLaymanSynchronizing,
  setLaymanLayerDescriptor,
} from '../../common/layer-extensions';

export type WfsSyncParams = {
  /** Endpoint description */
  ep: HsEndpoint;
  /** Array of features to add */
  add;
  /** Array of features to update */
  upd;
  /** Array of features to delete */
  del;
  /** OpenLayers layer which has to have a title attribute */
  layer: VectorLayer<VectorSource<Geometry>>;
};

@Injectable({
  providedIn: 'root',
})
export class HsLaymanService implements HsSaverService {
  crs: string;
  pendingLayers: Array<string> = [];
  laymanLayerPending: Subject<any> = new Subject();
  totalProgress = 0;
  constructor(
    public HsUtilsService: HsUtilsService,
    private http: HttpClient,
    public HsMapService: HsMapService,
    public HsLogService: HsLogService,
    public HsCommonEndpointsService: HsCommonEndpointsService,
    public $log: HsLogService,
    public HsToastService: HsToastService,
    public HsLanguageService: HsLanguageService
  ) {}

  /**
   * Save composition to Layman
   * @param compositionJson Json with composition definition
   * @param endpoint Endpoint description
   * @param compoData Additional fields for composition such
   * @param saveAsNew Save as new composition as title, name
   * @returns Promise result of POST
   */
  async save(
    compositionJson,
    endpoint,
    compoData,
    saveAsNew: boolean
  ): Promise<any> {
    const write =
      compoData.access_rights['access_rights.write'] == 'private'
        ? endpoint.user
        : compoData.access_rights['access_rights.write'];
    const read =
      compoData.access_rights['access_rights.read'] == 'private'
        ? endpoint.user
        : compoData.access_rights['access_rights.read'];
    try {
      let response: any;
      let success = false;
      //Need safety against infinite loop when fixing errors and retrying
      let amendmentsApplied = false;
      //If at First You Don't Succeed, Try, Try Again
      while (!success) {
        const formdata = new FormData();
        formdata.append(
          'file',
          new Blob([JSON.stringify(compositionJson)], {
            type: 'application/json',
          }),
          'blob.json'
        );
        formdata.append('name', compoData.name);
        formdata.append('title', compoData.title);
        formdata.append('abstract', compoData.abstract);
        const headers = new HttpHeaders();
        headers.append('Content-Type', null);
        headers.append('Accept', 'application/json');
        formdata.append('access_rights.read', read);
        formdata.append('access_rights.write', write);

        const workspace = compoData.workspace
          ? saveAsNew
            ? endpoint.user
            : compoData.workspace
          : endpoint.user;

        const options = {
          headers: headers,
          withCredentials: true,
        };
        response = await this.http[saveAsNew ? 'post' : 'patch'](
          `${endpoint.url}/rest/workspaces/${workspace}/maps${
            saveAsNew ? `?${Math.random()}` : `/${compoData.name}`
          }`,
          formdata,
          options
        ).toPromise();
        //Unsuccessfull request response contains code,detail and message properties
        if (!response.code) {
          success = true;
        } else {
          if (amendmentsApplied) {
            break;
          }
          featuresTypeFallback(response, compositionJson);
          amendmentsApplied = true;
        }
      }
      return response;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Send layer definition and features to Layman
   * @param endpoint Endpoint description
   * @param geojson Geojson object with features to send to server
   * @param description Object containing {name, title, crs, workspace, access_rights} of
   * layer to retrieve
   * @param layerDesc Previously fetched layer descriptor
   * @returns Promise result of POST/PATCH
   */
  private async makeUpsertLayerRequest(
    endpoint,
    geojson,
    description,
    layerDesc?
  ): Promise<string> {
    const formdata = new FormData();
    if (geojson) {
      formdata.append(
        'file',
        new Blob([JSON.stringify(geojson)], {type: 'application/geo+json'}),
        'blob.geojson'
      );
    }

    const files_to_async_upload = [];
    const sumFileSize = formdata
      .getAll('file')
      .filter((f) => (f as File).name)
      .reduce((prev, f) => prev + (f as File).size, 0);
    const async_upload = sumFileSize >= PREFER_RESUMABLE_SIZE_LIMIT;
    if (async_upload) {
      this.switchFormDataToFileNames(formdata, files_to_async_upload);
    }

    formdata.append(
      'sld',
      new Blob([description.sld], {type: 'application/octet-stream'}),
      'file.sld'
    );
    formdata.append('name', description.name);
    formdata.append('title', description.title);
    formdata.append('crs', description.crs);

    if (description.access_rights) {
      const write =
        description.access_rights['access_rights.write'] == 'private'
          ? endpoint.user
          : description.access_rights['access_rights.write'] ?? 'EVERYONE';
      const read =
        description.access_rights['access_rights.read'] == 'private'
          ? endpoint.user
          : description.access_rights['access_rights.read'] ?? 'EVERYONE';

      formdata.append('access_rights.write', write);
      formdata.append('access_rights.read', read);
    }

    const headers = new HttpHeaders();
    headers.append('Content-Type', null);
    headers.append('Accept', 'application/json');
    const options = {
      headers: headers,
      withCredentials: true,
    };
    try {
      let layerDesc2 = layerDesc;
      try {
        if (layerDesc2 == undefined) {
          layerDesc2 = await this.describeLayer(
            endpoint,
            description.name,
            description.workspace
          );
        }
      } catch (ex) {
        this.HsLogService.log(`Creating layer ${description.name}`);
      }
      return await this.http[layerDesc2?.name ? 'patch' : 'post'](
        `${endpoint.url}/rest/workspaces/${description.workspace}/layers${
          layerDesc2?.name ? '/' + description.name : ''
        }?${Math.random()}`,
        formdata,
        options
      )
        .toPromise()
        .then(async (data: any) => {
          if (data && data.length > 0) {
            if (async_upload) {
              const promise = await this.asyncUpload(
                files_to_async_upload,
                data,
                {
                  url: endpoint.url,
                  user: description.workspace,
                }
              );
              return promise;
            } else {
              return data;
            }
          } else {
            return data;
          }
        });
    } catch (err) {
      throw err;
    }
  }

  /**
   * Saves files for later upload and switches from files to file names in form data
   */
  switchFormDataToFileNames(
    formdata: FormData,
    files_to_async_upload: Array<any>
  ): void {
    const files = formdata.getAll('file').filter((f) => (f as any).name);
    files_to_async_upload.push(...files);

    const file_names = files.map((f) => (f as any).name);
    formdata.delete('file');
    file_names.forEach((fn) => formdata.append('file', fn));
  }

  /**
   * Use resumable to chunk upload data larger than PREFER_RESUMABLE_SIZE_LIMIT(2MB)
   */
  asyncUpload(files_to_async_upload, data, endpoint): Promise<any> {
    return new Promise((resolve, reject) => {
      files_to_async_upload = files_to_async_upload.filter(
        (file_to_upload) =>
          !!data[0]['files_to_upload'].find(
            (expected_file) => file_to_upload.name === expected_file.file
          )
      );
      const layername = data[0]['name'];
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
        this.HsLogService.log(`Async upload finished successfully!`);
        resolve(data);
      });
      resumable.on('fileError', (file, message) => {
        console.log('fileError', message);
        reject(message);
      });
      resumable.on('fileSuccess', (file, message) => {
        this.HsLogService.log(message);
      });
      resumable.on('fileProgress', (file) => {
        chunksProgress[file.uniqueIdentifier] = file.progress(false);
        const sum = Object.values(chunksProgress).reduce((a, b) => a + b);
        this.totalProgress = sum / files_to_async_upload.length;
      });
      resumable.on('filesAdded', (files) => {
        this.HsLogService.log(
          `${files.length} files added to Resumable.js, starting async upload.`
        );
        resumable.upload();
      });

      // add files to Resumable.js, it will fire 'filesAdded' event
      resumable.addFiles(files_to_async_upload);
    });
  }

  /**
   * Create Layman layer if needed and send all features
   * @param endpoint Endpoint description
   * @param ep
   * @param layer Layer to get Layman friendly name for
   * get features
   */
  public async upsertLayer(
    ep: HsEndpoint,
    layer: VectorLayer<VectorSource<Geometry>>,
    withFeatures: boolean
  ): Promise<void> {
    if (layer.getSource().loading) {
      return;
    }
    const layerName = getLayerName(layer);
    let layerTitle = getTitle(layer);

    const f = new GeoJSON();
    const crsSupported = ['EPSG:4326', 'EPSG:3857'].includes(this.crs);
    let geojson;
    if (withFeatures) {
      if (!crsSupported) {
        geojson = f.writeFeaturesObject(
          layer
            .getSource()
            .getFeatures()
            .map((f) => {
              const f2 = f.clone();
              f2.getGeometry().transform(this.crs, 'EPSG:3857');
              return f2;
            })
        );
      } else {
        geojson = f.writeFeaturesObject(layer.getSource().getFeatures());
      }
    }

    if ((ep?.version?.split('.').join() as unknown as number) < 171) {
      layerTitle = getLaymanFriendlyLayerName(layerTitle);
    }
    setHsLaymanSynchronizing(layer, true);
    await this.makeUpsertLayerRequest(ep, geojson, {
      title: layerTitle,
      name: layerName,
      crs: crsSupported ? this.crs : 'EPSG:3857',
      workspace: getWorkspace(layer),
      access_rights: getAccessRights(layer),
      sld: getSld(layer),
    });
    setTimeout(async () => {
      await this.makeGetLayerRequest(ep, layer);
      setHsLaymanSynchronizing(layer, false);
    }, 2000);
  }

  /**
   * Sync wfs features using transaction. Publish layer first if needed
   * @param param0
   * @param param0.ep
   * @param param0.add
   * @param param0.upd
   * @param param0.del
   * @param param0.layer
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
        this.HsLogService.warn(`Layer ${name} didn't exist. Creating..`);
        this.upsertLayer(ep, layer, true);
        return;
      }
      desc.wfs.url = desc.wfs.url;
      return this.makeWfsRequest(
        {ep: endpoint, add, upd, del, layer},
        desc.wfs.url
      );
    } catch (ex) {
      throw ex;
    }
  }

  /**
   * Make WFS transaction request
   * @param param0 Object describing endpoint, layer and arrays
   * for each of the methods: update, del, insert containing the features to be processed
   * @param param0.add
   * @param param0.ep
   * @param url Layman client / geoserver
   * @param param0.upd
   * @param param0.del
   * @param param0.layer
   */
  private async makeWfsRequest(
    {ep, add, upd, del, layer}: WfsSyncParams,
    url: string
  ): Promise<string> {
    try {
      const srsName = this.HsMapService.getCurrentProj().getCode();
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
        options
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
      const r: any = await this.http.post(url, body, httpOptions).toPromise();
      return r;
    } catch (ex) {
      this.HsLogService.error(ex);
    }
  }

  private cacheLaymanDescriptor(
    layer: VectorLayer<VectorSource<Geometry>>,
    desc: HsLaymanLayerDescriptor,
    endpoint: HsEndpoint
  ): void {
    if (endpoint.user != 'browser') {
      setLaymanLayerDescriptor(layer, desc);
    }
  }

  /**
   * @param ep
   * @param layer
   * @param endpoint Endpoint description
   * @param layerName Escaped name of layer
   * @returns Promise with WFS xml (GML3.1) response
   * with features for a specified layer
   * Retrieve layers features from server
   */
  async makeGetLayerRequest(
    ep: HsEndpoint,
    layer: VectorLayer<VectorSource<Geometry>>
  ): Promise<string> {
    /* Clone because endpoint.user can change while the request is processed
    and then description might get cached even if anonymous user was set before.
    Should not cache anonymous layers, because layer can be authorized anytime */
    const endpoint = {...ep};
    let descr: HsLaymanLayerDescriptor;
    const layerName = getLayerName(layer);
    try {
      descr = await this.describeLayer(
        endpoint,
        layerName,
        getWorkspace(layer)
      );
      if (
        descr === null || //In case of response?.code == 15 || 32
        (descr.wfs.status == descr.wms.status && wfsNotAvailable(descr))
      ) {
        return null;
      } else if (descr?.name && !wfsNotAvailable(descr)) {
        this.cacheLaymanDescriptor(layer, descr, endpoint);
      }
    } catch (ex) {
      //If layman returned 404
      return null;
    }

    try {
      /* When OL will support GML3.2, then we can use WFS
        version 2.0.0. Currently only 3.1.1 is possible */
      const response: string = await this.http
        .get(
          descr.wfs.url +
            '?' +
            this.HsUtilsService.paramsToURL({
              service: 'wfs',
              version: '1.1.0',
              request: 'GetFeature',
              typeNames: `${getWorkspace(layer)}:${descr.name}`,
              r: Math.random(),
              srsName: this.HsMapService.getCurrentProj().getCode(),
            }),
          {responseType: 'text', withCredentials: true}
        )
        .toPromise();
      return response;
    } catch (ex) {
      return null;
    }
  }

  /**
   * Try getting layer description from layman.
   * @param endpoint Endpoint description
   * @param layerName Layer name
   * @returns Promise which returns layers
   * description containing name, file, wms, wfs urls etc.
   */
  async describeLayer(
    endpoint: HsEndpoint,
    layerName: string,
    workspace: string
  ): Promise<HsLaymanLayerDescriptor> {
    try {
      layerName = getLaymanFriendlyLayerName(layerName); //Better safe than sorry
      const response: any = await this.http
        .get(
          `${
            endpoint.url
          }/rest/workspaces/${workspace}/layers/${layerName}?${Math.random()}`,
          {
            withCredentials: true,
          }
        )
        .toPromise();
      if (response?.code == 15 || response?.code == 15 || wfsFailed(response)) {
        return null;
      }
      if (
        wfsPendingOrStarting(response) ||
        (response.wfs?.status == 'SUCCESS' && response.wfs?.url == undefined)
      ) {
        if (!this.pendingLayers.includes(layerName)) {
          this.pendingLayers.push(layerName);
          this.laymanLayerPending.next(this.pendingLayers);
        }
        await new Promise((resolve) => setTimeout(resolve, 3500));
        return this.describeLayer(endpoint, layerName, workspace);
      }
      if (response.name) {
        this.managePendingLayers(layerName);
        return response;
      }
    } catch (ex) {
      this.managePendingLayers(layerName);
      this.HsLogService.error(ex);
      throw ex;
    }
  }

  private managePendingLayers(layerName) {
    if (this.pendingLayers.includes(layerName)) {
      this.pendingLayers = this.pendingLayers.filter(
        (layer) => layer != layerName
      );
      this.laymanLayerPending.next(this.pendingLayers);
    }
  }

  /**
   * Removes selected layer from layman.
   * @param layer -
   */
  removeLayer(layer: Layer<Source> | string): void {
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        const layerName =
          typeof layer == 'string' ? layer : getLayerName(layer);
        this.http
          .delete(`${ds.url}/rest/workspaces/${ds.user}/layers/${layerName}`, {
            withCredentials: true,
          })
          .toPromise()
          .catch((error) => {
            this.HsToastService.createToastPopupMessage(
              this.HsLanguageService.getTranslation('COMMON.warning'),
              this.HsLanguageService.getTranslationIgnoreNonExisting(
                'SAVECOMPOSITION',
                'removeLayerError',
                {
                  error: error.error.message,
                  layer:
                    layer instanceof Layer
                      ? (layer as Layer<Source>).get('title')
                      : layer,
                }
              ),
              {serviceCalledFrom: 'HsLaymanService'}
            );
          });
      });
  }

  getLaymanEndpoint(): HsEndpoint {
    return this.HsCommonEndpointsService.endpoints.find(
      (e) => e.type == 'layman'
    );
  }

  isLaymanGuest(): boolean {
    const endpoint = this.getLaymanEndpoint();
    return endpoint.user == 'anonymous' || endpoint.user == 'browser';
  }
}

/**
 * Mend error when features are not encoded as string.
 * They would not need to be encoded in future, but for now Layman
 * and composition schema requires them to be.
 * @param response - Check if server response contained error about features
 * @param compositionJson  - Composition json being sent on first try
 */
function featuresTypeFallback(response: any, compositionJson: any) {
  if (
    response.code == 2 &&
    response.detail &&
    response.detail['validation-errors'] &&
    response.detail['validation-errors'].some((er) =>
      er.message.startsWith("{'type': 'FeatureCollection'")
    )
  ) {
    for (const layer of compositionJson.layers.filter(
      (l) => l.features && typeof l.features !== 'string'
    )) {
      layer.features = JSON.stringify(layer.features);
    }
  }
}
