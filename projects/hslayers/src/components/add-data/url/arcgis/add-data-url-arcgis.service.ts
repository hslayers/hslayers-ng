import {Injectable} from '@angular/core';

import {Group} from 'ol/layer';
import {Tile} from 'ol/layer';
import {TileArcGISRest} from 'ol/source';

import {CapabilitiesResponseWrapper} from '../../../../common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataCommonUrlService} from '../../common/add-data-common.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsAddDataUrlTypeServiceModel} from '../models/add-data-url-type-service.model';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {addDataUrlDataObject} from '../types/add-data-url-data-object.type';
import {addLayerOptions} from '../types/add-data-url-layer-options.type';
import {addLayersRecursivelyOptions} from '../types/add-data-url-recursive-options.type';
import {getPreferredFormat} from '../../../../common/format-utils';

@Injectable({providedIn: 'root'})
export class HsAddDataArcGisService implements HsAddDataUrlTypeServiceModel {
  data: addDataUrlDataObject;

  constructor(
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsLayoutService: HsLayoutService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataCommonUrlService: HsAddDataCommonUrlService
  ) {
    this.data = {
      map_projection: '',
      register_metadata: true,
      tile_size: 512,
      use_resampling: false,
      use_tiles: true,
    };
  }

  async addLayerFromCapabilities(
    wrapper: CapabilitiesResponseWrapper
  ): Promise<void> {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.hsAddDataCommonUrlService.throwParsingError(
        wrapper.response.message
      );
      return;
    }
    try {
      await this.createLayer(
        wrapper.response,
        this.hsAddDataCommonUrlService.layerToSelect
      );
      if (this.hsAddDataCommonUrlService.layerToSelect) {
        this.addLayers(true);
      }
    } catch (e) {
      this.hsAddDataCommonUrlService.throwParsingError(e);
    }
  }

  createLayer(response, layerToSelect: string): Promise<void> {
    return new Promise(() => {
      try {
        const caps = response;
        this.data.map_projection = this.hsMapService.map
          .getView()
          .getProjection()
          .getCode()
          .toUpperCase();
        this.data.title = caps.mapName || 'Arcgis layer';
        this.data.description = addAnchors(caps.description);
        this.data.version = caps.currentVersion;
        this.data.image_formats = caps.supportedImageFormatTypes
          ? caps.supportedImageFormatTypes.split(',')
          : [];
        this.data.query_formats = caps.supportedQueryFormats
          ? caps.supportedQueryFormats.split(',')
          : [];
        this.data.srss = caps.spatialReference?.wkid
          ? [caps.spatialReference.wkid.toString()]
          : [];
        this.data.services = caps.layers || caps.services;
        this.data.srs = (() => {
          for (const srs of this.data.srss) {
            if (srs.includes('3857')) {
              return srs;
            }
          }
          return this.data.srss[0];
        })();
        this.data.resample_warning = this.hsAddDataCommonUrlService.srsChanged(
          this.data.srs
        );
        this.hsAddDataUrlService.selectLayerByName(
          layerToSelect,
          this.data.services,
          'Name'
        );
        this.data.image_format = getPreferredFormat(this.data.image_formats, [
          'PNG32',
          'PNG',
          'GIF',
          'JPG',
        ]);
        this.data.query_format = getPreferredFormat(this.data.query_formats, [
          'geoJSON',
          'JSON',
        ]);
        this.hsAddDataCommonUrlService.loadingInfo = false;
      } catch (e) {
        throw new Error(e);
      }
    });
  }

  /**
   * @param checkedOnly -
   * Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
   * @param checked - Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean): void {
    if (this.data.services === undefined) {
      return;
    }

    if (this.data.base) {
      this.addLayer(
        {},
        {
          layerTitle: this.data.title.replace(/\//g, '&#47;'),
          path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
          subLayers: null,
        }
      );
    } else {
      for (const layer of this.data.services) {
        this.addLayersRecursively(layer, {checkedOnly: checkedOnly});
      }
    }
    this.data.base = false;
    this.hsLayoutService.setMainPanel('layermanager');
  }

  addLayersRecursively(
    layer: any,
    options: addLayersRecursivelyOptions = {checkedOnly: true}
  ): void {
    if (!options.checkedOnly || layer.checked) {
      if (layer.Layer === undefined) {
        this.addLayer(layer, {
          layerTitle: layer.name.replace(/\//g, '&#47;'),
          path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
          subLayers: this.hsAddDataCommonUrlService.getSublayerNames(layer),
        });
      } else {
        const clone = this.hsUtilsService.structuredClone(layer);
        delete clone.Layer;
        this.addLayer(layer, {
          layerTitle: layer.name.replace(/\//g, '&#47;'),
          path: this.hsUtilsService.undefineEmptyString(this.data.folder_name),
          imageFormat: this.data.image_format,
          queryFormat: this.data.query_format,
          tileSize: this.data.tile_size,
          crs: this.data.srs,
          subLayers: this.hsAddDataCommonUrlService.getSublayerNames(layer),
        });
      }
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer, {checkedOnly: options.checkedOnly});
      }
    }
  }

  /**
   * Add selected layer to map
   * @param layer - capabilities layer object
   * @param layerTitle - layer name in the map
   * @param path - Path name
   * @param imageFormat - Format in which to serve image. Usually: image/png
   * @param queryFormat - See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param tileSize - Tile size in pixels
   * @param crs - of the layer
   * @param subLayers - Static sub-layers of the layer
   */
  addLayer(layer, options: addLayerOptions): void {
    let attributions = [];
    if (layer.Attribution) {
      attributions = [
        `<a href="${layer.Attribution.OnlineResource}">${layer.Attribution.Title}</a>`,
      ];
    }
    const dimensions = {};
    if (layer.Dimension) {
      for (const val of layer.Dimension) {
        dimensions[val.name] = val;
      }
    }

    const legends = [];
    if (layer.Style && layer.Style[0].LegendURL) {
      legends.push(layer.Style[0].LegendURL[0].OnlineResource);
    }
    const source = new TileArcGISRest({
      url: this.data.get_map_url,
      attributions,
      //projection: me.data.srs,
      params: Object.assign(
        {
          LAYERS: this.data.base
            ? `show:${this.hsAddDataCommonUrlService.createBasemapName(
                this.data.services,
                'name'
              )}`
            : `show:${layer.name}`,
          INFO_FORMAT: layer.queryable ? options.queryFormat : undefined,
          FORMAT: options.imageFormat,
        },
        {}
      ),
      crossOrigin: 'anonymous',
    });
    const new_layer = new Tile({
      properties: {
        title: options.layerTitle,
        removable: true,
        path: options.path,
        base: this.data.base,
        dimensions,
      },
      source,
      maxResolution: layer.minScale > 0 ? layer.minScale : undefined,
    });
    //OlMap.proxifyLayerLoader(new_layer, me.data.use_tiles);
    this.hsMapService.map.addLayer(new_layer);
  }

  /**
   * FIXME: UNUSED
   * Add service and its layers to project TODO
   * @param url - Service url
   * @param group - Group layer to which add layer to
   */
  async addService(url: string, group: Group): Promise<void> {
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(url);
    const ol_layers = this.hsArcgisGetCapabilitiesService.service2layers(
      wrapper.response
    );
    ol_layers.forEach((layer) => {
      if (group !== undefined) {
        group.getLayers().push(layer);
      } else {
        this.hsMapService.addLayer(layer);
      }
    });
  }
}
