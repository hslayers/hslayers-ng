import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {lastValueFrom, of} from 'rxjs';
import {catchError} from 'rxjs/operators';

import {HsCommonLaymanService} from './layman.service';
import {HsLaymanGetLayer, HsLaymanLayerDescriptor} from 'hslayers-ng/types';
import {
  getLaymanFriendlyLayerName,
  layerParamPendingOrStarting,
  wfsFailed,
} from './layman-utils';
import {HsLogService} from 'hslayers-ng/services/log';

@Injectable({
  providedIn: 'root',
})
export class HsCommonLaymanLayerService {
  http = inject(HttpClient);
  hsCommonLaymanService = inject(HsCommonLaymanService);
  hsLogService = inject(HsLogService);

  pendingRequests: Map<string, Promise<HsLaymanLayerDescriptor>> = new Map();
  pendingLayers: WritableSignal<Array<string>> = signal([]);
  layerDescriptorCache: Map<string, HsLaymanLayerDescriptor> = new Map();

  getLayersCache: Map<string, HsLaymanGetLayer> = new Map();

  /**
   * Get layer from Layman by UUID
   * @param uuid - UUID of the layer
   * @param useCache - Whether to use cached layer description (default: false - always get fresh data)
   * @returns Promise which returns layer
   */
  async getLayerWithUUID(
    uuid: string,
    {useCache = false}: {useCache?: boolean} = {},
  ) {
    try {
      if (useCache && this.getLayersCache.has(uuid)) {
        return this.getLayersCache.get(uuid);
      }

      const url = `${this.hsCommonLaymanService.layman().url}/rest/layers`;
      const response = await lastValueFrom(
        this.http.get<HsLaymanGetLayer[]>(url, {withCredentials: true}).pipe(
          catchError((error) => {
            this.hsLogService.error('Error getting layers from Layman:', error);
            return of([]);
          }),
        ),
      );

      //Cache all returned layers
      response.forEach((layer) => {
        this.getLayersCache.set(layer.uuid, layer);
      });
      return this.getLayersCache.get(uuid);
    } catch (error) {
      this.hsLogService.error('Error in getLayers:', error);
      return undefined;
    }
  }

  /**
   * Try getting layer's description from Layman. Subsequent request with same parameters
   * are reused.
   * @param layerName - Interacted layer's name
   * @param workspace - Current Layman's workspace
   * @param ignoreStatus - Whether to ignore layer status
   * @param useCache - Whether to use cached layer description (default: false - always get fresh data)
   * @returns Promise which returns layers
   * description containing name, file, WMS, WFS urls etc.
   */
  async describeLayer(
    layerName: string,
    workspace: string,
    options: {
      ignoreStatus?: boolean;
      useCache?: boolean;
    } = {useCache: false},
  ): Promise<HsLaymanLayerDescriptor> {
    const requestKey = `${workspace}/${layerName}`;
    let name = layerName;
    // Check if there's a cached response and useCache is true
    if (options.useCache && this.layerDescriptorCache.has(requestKey)) {
      return this.layerDescriptorCache.get(requestKey);
    }

    // Check if there's a pending request with the same parameters
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey);
    }
    //Try to identify whether name is uuid if thats the case get layer descriptor
    //to get the proper name
    if (name.includes('l_') && name.includes('-') && name.length > 36) {
      const layerDescriptor = await this.getLayerWithUUID(name);
      if (layerDescriptor) {
        name = layerDescriptor.name;
      }
    }

    const desc = this.makeDescribeLayerRequest(
      name,
      workspace,
      options.ignoreStatus,
    );
    // Store the promise for the request
    this.pendingRequests.set(requestKey, desc);

    // Cache the response once resolved
    desc.then((response) => {
      if (response) {
        this.layerDescriptorCache.set(requestKey, response);
      }
    });

    return desc;
  }

  /**
   * Clear the cache for a specific layer or all layers
   * @param layerName - Optional layer name to clear specific cache
   * @param workspace - Optional workspace to clear specific cache
   */
  clearLayerDescriptorCache(layerName?: string, workspace?: string): void {
    if (layerName && workspace) {
      this.layerDescriptorCache.delete(`${workspace}/${layerName}`);
    } else {
      this.layerDescriptorCache.clear();
    }
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
          if (!this.pendingLayers().includes(layerName)) {
            this.pendingLayers.update((layers) => [...layers, layerName]);
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
    if (this.pendingLayers().includes(layerName)) {
      this.pendingLayers.update((layers) =>
        layers.filter((layer) => layer != layerName),
      );
    }
  }
}
