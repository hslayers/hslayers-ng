import {GeoJSON, WFS} from 'ol/format';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Layer} from 'ol/layer';

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
  getLayerName,
  getLaymanFriendlyLayerName,
  tweakGeoserverUrl,
  wfsNotAvailable,
} from './layman-utils';
import {
  getLaymanLayerDescriptor,
  getTitle,
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
  /** Openlayers layer which has to have a title attribute */
  layer: Layer;
};

@Injectable({
  providedIn: 'root',
})
export class HsLaymanService implements HsSaverService {
  crs: string;
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
   * @param saveAsNew Save as new composition
   * as title, name
   * @returns {Promise<any>} Promise result of POST
   */
  save(compositionJson, endpoint, compoData, saveAsNew: boolean) {
    const write =
      compoData.write == 'EVERYONE' ? compoData.write : endpoint.user;
    let read;
    if (write == 'EVERYONE') {
      read = write;
    } else {
      read = compoData.read == 'EVERYONE' ? compoData.read : endpoint.user;
    }
    return new Promise(async (resolve, reject) => {
      const formdata = new FormData();
      formdata.append(
        'file',
        new Blob([JSON.stringify(compositionJson)], {
          type: 'application/json',
        }),
        'blob.json'
      );
      formdata.append('name', compoData.title);
      formdata.append('title', compoData.title);
      formdata.append('abstract', compoData.abstract);
      const headers = new HttpHeaders();
      headers.append('Content-Type', null);
      headers.append('Accept', 'application/json');
      formdata.append('access_rights.read', read);
      formdata.append('access_rights.write', write);
      const options = {
        headers: headers,
      };
      try {
        const response: any = await this.http[saveAsNew ? 'post' : 'patch'](
          `${endpoint.url}/rest/${endpoint.user}/maps${
            saveAsNew
              ? `?${Math.random()}`
              : '/' + getLaymanFriendlyLayerName(compoData.title)
          }`,
          formdata,
          options
        ).toPromise();
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Send layer definition and features to Layman
   * @param endpoint Endpoint description
   * @param geojson Geojson object with features to send to server
   * @param description Object containing {name, title, crs} of
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
    formdata.append(
      'file',
      new Blob([JSON.stringify(geojson)], {type: 'application/geo+json'}),
      'blob.geojson'
    );
    formdata.append(
      'sld',
      new Blob([], {type: 'application/octet-stream'}),
      ''
    );
    formdata.append('name', description.name);
    formdata.append('title', description.title);
    formdata.append('crs', description.crs);
    const headers = new HttpHeaders();
    headers.append('Content-Type', null);
    headers.append('Accept', 'application/json');
    const options = {
      headers: headers,
    };
    try {
      let layerDesc2 = layerDesc;
      try {
        if (layerDesc2 == undefined) {
          layerDesc2 = await this.describeLayer(endpoint, description.name);
        }
      } catch (ex) {
        this.HsLogService.log(`Creating layer ${description.name}`);
      }
      const response: any = await this.http[
        layerDesc2?.name ? 'patch' : 'post'
      ](
        `${endpoint.url}/rest/${endpoint.user}/layers${
          layerDesc2?.name ? '/' + description.name : ''
        }?${Math.random()}`,
        formdata,
        options
      ).toPromise();
      return response;
    } catch (err) {
      throw err;
    }
  }

  /**
   * Create Layman layer if needed and send all features
   * @param endpoint Endpoint description
   * @param layer Layer to get Layman friendly name for
   * get features
   */
  public async upsertLayer(ep: HsEndpoint, layer: Layer): Promise<void> {
    if (layer.getSource().loading) {
      return;
    }
    const layerName = getLayerName(layer);
    let layerTitle = getTitle(layer);
    const f = new GeoJSON();
    const geojson = f.writeFeaturesObject(layer.getSource().getFeatures());

    if (((ep?.version?.split('.').join() as unknown) as number) < 171) {
      layerTitle = getLaymanFriendlyLayerName(layerTitle);
    }
    setHsLaymanSynchronizing(layer, true);
    await this.makeUpsertLayerRequest(ep, geojson, {
      title: layerTitle,
      name: layerName,
      crs: ['EPSG:4326', 'EPSG:3857'].includes(this.crs)
        ? this.crs
        : 'EPSG:3857',
    });
    setTimeout(async () => {
      await this.makeGetLayerRequest(ep, layer);
      setHsLaymanSynchronizing(layer, false);
    }, 2000);
  }

  /**
   * Sync wfs features using transaction. Publish layer first if needed
   * @param param0
   * @returns Promise result of POST
   */
  async sync({ep, add, upd, del, layer}: WfsSyncParams): Promise<string> {
    /* Clone because endpoint.user can change while the request is processed
    and then description might get cached even if anonymous user was set before.
    Should not cache anonymous layers, because layer can be authorized any moment */
    const endpoint = {...ep};
    try {
      let desc = getLaymanLayerDescriptor(layer);
      const name = getLayerName(layer);
      try {
        if (!desc) {
          desc = await this.describeLayer(endpoint, name);
          this.cacheLaymanDescriptor(layer, desc, endpoint);
        }
        if (desc.name == undefined) {
          throw `Layer or its name didn't exist`;
        }
      } catch (ex) {
        this.HsLogService.warn(`Layer ${name} didn't exist. Creating..`);
        this.upsertLayer(ep, layer);
        return;
      }
      desc.wfs.url = tweakGeoserverUrl(desc.wfs.url);
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
   * @param url Layman client / geoserver
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
      };
      const featureNode = wfsFormat.writeTransaction(add, upd, del, options);
      const headers = new HttpHeaders();
      headers.append('Content-Type', 'application/xml');
      headers.append('Accept', 'application/xml');
      const httpOptions: any = {
        headers,
        responseType: 'text',
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
    layer: Layer,
    desc: HsLaymanLayerDescriptor,
    endpoint: HsEndpoint
  ): void {
    if (endpoint.user != 'browser') {
      setLaymanLayerDescriptor(layer, desc);
    }
  }

  /**
   * @param layer
   * @param endpoint Endpoint description
   * @param layerName Escaped name of layer
   * @returns Promise with WFS xml (GML3.1) response
   * with features for a specified layer
   * Retrieve layers features from server
   */
  async makeGetLayerRequest(ep: HsEndpoint, layer: Layer): Promise<string> {
    /* Clone because endpoint.user can change while the request is processed
    and then description might get cached even if anonymous user was set before.
    Should not cache anonymous layers, because layer can be authorized any moment */
    const endpoint = {...ep};
    let descr: HsLaymanLayerDescriptor;
    const layerName = getLayerName(layer);
    try {
      descr = await this.describeLayer(endpoint, layerName);
      if (
        descr === null || //In case of response?.code == 15
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
          tweakGeoserverUrl(descr.wfs.url) +
            '?' +
            this.HsUtilsService.paramsToURL({
              service: 'wfs',
              version: '1.1.0',
              request: 'GetFeature',
              typeNames: `${endpoint.user}:${descr.name}`,
              r: Math.random(),
              srsName: this.HsMapService.getCurrentProj().getCode(),
            }),
          {responseType: 'text'}
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
   * description containig name, file, wms, wfs urls etc.
   */
  async describeLayer(
    endpoint: HsEndpoint,
    layerName: string
  ): Promise<HsLaymanLayerDescriptor> {
    try {
      layerName = getLaymanFriendlyLayerName(layerName); //Better safe than sorry
      const response: any = await this.http
        .get(
          `${endpoint.url}/rest/${
            endpoint.user
          }/layers/${layerName}?${Math.random()}`
        )
        .toPromise();
      if (response?.code == 15) {
        return null;
      }
      if (response.name) {
        return response;
      }
    } catch (ex) {
      this.HsLogService.error(ex);
      throw ex;
    }
  }

  /**
   * Removes selected layer from layman.
   * @param layer
   */
  removeLayer(layer: Layer) {
    (this.HsCommonEndpointsService.endpoints || [])
      .filter((ds) => ds.type == 'layman')
      .forEach((ds) => {
        this.http
          .delete(`${ds.url}/rest/${ds.user}/layers/${getLayerName(layer)}`)
          .toPromise()
          .catch((error) => {
            this.HsToastService.createToastPopupMessage(
              this.HsLanguageService.getTranslation('COMMON.warning'),
              this.HsLanguageService.getTranslationIgnoreNonExisting(
                'SAVEMAP',
                'removeLayerError',
                {error: error.error.message, layer: layer.get('title')}
              )
            );
          });
      });
  }

  getLaymanEndpoint() {
    return this.HsCommonEndpointsService.endpoints.find(
      (e) => e.type == 'layman'
    );
  }
}
