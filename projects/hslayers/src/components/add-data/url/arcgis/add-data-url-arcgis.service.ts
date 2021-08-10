import {Injectable} from '@angular/core';

import {Attribution} from 'ol/control';
import {Group} from 'ol/layer';
import {Tile} from 'ol/layer';
import {TileArcGISRest} from 'ol/source';

import {CapabilitiesResponseWrapper} from 'projects/hslayers/src/common/get-capabilities/capabilities-response-wrapper';
import {HsAddDataService} from '../../add-data.service';
import {HsAddDataUrlService} from '../add-data-url.service';
import {HsArcgisGetCapabilitiesService} from '../../../../common/get-capabilities/arcgis-get-capabilities.service';
import {HsDimensionService} from '../../../../common/dimension.service';
import {HsEventBusService} from '../../../core/event-bus.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {getPreferredFormat} from '../../../../common/format-utils';

@Injectable({providedIn: 'root'})
export class HsAddDataArcGisService {
  data;
  url: string;
  showDetails: boolean;
  layerToSelect: string;
  loadingInfo = false;

  //TODO: all dimension related things need to be refactored into separate module
  getDimensionValues = this.hsDimensionService.getDimensionValues;

  constructor(
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsDimensionService: HsDimensionService,
    public hsLayoutService: HsLayoutService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService,
    public hsEventBusService: HsEventBusService,
    public hsAddDataUrlService: HsAddDataUrlService,
    public hsAddDataService: HsAddDataService
  ) {
    this.data = {
      useResampling: false,
      useTiles: true,
      mapProjection: undefined,
      registerMetadata: true,
      tileSize: 512,
    };
    this.hsAddDataService.cancelUrlRequest.subscribe(() => {
      this.loadingInfo = false;
      this.showDetails = false;
    });
  }

  async addLayerFromCapabilities(wrapper: CapabilitiesResponseWrapper) {
    if (!wrapper.response && !wrapper.error) {
      return;
    }
    if (wrapper.error) {
      this.throwParsingError(wrapper.response.message);
      return;
    }
    try {
      await this.createLayer(wrapper.response, this.layerToSelect);
      if (this.layerToSelect) {
        this.addLayers(true);
      }
    } catch (e) {
      if (e.status == 401) {
        this.throwParsingError(
          'Unauthorized access. You are not authorized to query data from this service'
        );
        return;
      }
      this.throwParsingError(e);
    }
  }

  throwParsingError(e) {
    this.url = null;
    this.showDetails = false;
    this.loadingInfo = false;
    this.hsAddDataUrlService.addDataCapsParsingError.next(e);
  }

  createLayer(response, layerToSelect: string): void {
    try {
      const caps = response;
      this.data.mapProjection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      this.data.title = caps.mapName;
      this.data.description = addAnchors(caps.description);
      this.data.version = caps.currentVersion;
      this.data.image_formats = caps.supportedImageFormatTypes.split(',');
      this.data.query_formats = caps.supportedQueryFormats
        ? caps.supportedQueryFormats.split(',')
        : [];
      this.data.srss = [caps.spatialReference.wkid];
      this.data.services = caps.layers;

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
      this.loadingInfo = false;
    } catch (e) {
      throw new Error(e);
    }
  }

  srsChanged(): void {
    setTimeout(() => {
      this.data.resample_warning =
        !this.hsArcgisGetCapabilitiesService.currentProjectionSupported([
          this.data.srs,
        ]);
    }, 0);
  }

  /**
   * @param checkedOnly
   * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
   * @param {boolean} checked Add all available layers or only checked ones. Checked=false=all
   */
  addLayers(checkedOnly: boolean): void {
    if (this.data.services === undefined) {
      return;
    }

    if (this.data.base) {
      this.addLayer(
        {},
        this.data.title.replace(/\//g, '&#47;'),
        this.hsUtilsService.undefineEmptyString(this.data.path),
        this.data.image_format,
        this.data.query_format,
        this.data.tile_size,
        this.data.srs,
        null
      );
    } else {
      for (const layer of this.data.services) {
        this.addLayersRecursively(layer, {checkedOnly: checkedOnly});
      }
    }
    this.data.base = false;
    this.hsLayoutService.setMainPanel('layermanager');
  }

  /**
   * Constructs body of LAYER parameter for getMap request
   * @param layer Optional. layer object received from capabilities. If no layer is provided
   * merge all checked layer ids into one string
   * @returns {string}
   */
  createBasemapName(layer?): string {
    if (!layer) {
      const names = [];

      for (const layer of this.data.services.filter((layer) => layer.checked)) {
        names.push(layer.id);
      }
      return `show:${names.join(',')}`;
    } else {
      return `show:${layer.id}`;
    }
  }

  private addLayersRecursively(layer, {checkedOnly = true}) {
    if (!checkedOnly || layer.checked) {
      if (layer.Layer === undefined) {
        this.addLayer(
          layer,
          layer.name.replace(/\//g, '&#47;'),
          this.hsUtilsService.undefineEmptyString(this.data.path),
          this.data.image_format,
          this.data.query_format,
          this.data.tile_size,
          this.data.srs,
          this.getSublayerNames(layer)
        );
      } else {
        const clone = this.hsUtilsService.structuredClone(layer);
        delete clone.Layer;
        this.addLayer(
          layer,
          layer.name.replace(/\//g, '&#47;'),
          this.hsUtilsService.undefineEmptyString(this.data.path),
          this.data.image_format,
          this.data.query_format,
          this.data.tile_size,
          this.data.srs,
          this.getSublayerNames(layer)
        );
      }
    }
    if (layer.Layer) {
      for (const sublayer of layer.Layer) {
        this.addLayersRecursively(sublayer, {checkedOnly: checkedOnly});
      }
    }
  }

  /**
   * @param service
   */
  getSublayerNames(service): any[] {
    if (service.layerToSelect) {
      return service.layers.map((l) => {
        const tmp: any = {};
        if (l.name) {
          tmp.name = l.name;
        }
        if (l.layer) {
          tmp.children = this.getSublayerNames(l);
        }
        return tmp;
      });
    } else {
      return [];
    }
  }

  hasNestedLayers(layer): boolean {
    if (layer === undefined) {
      return false;
    }
    return layer.layer !== undefined;
  }

  /**
   * @description Add selected layer to map
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param layerTitle
   * @param {string} path Path name
   * @param {string} imageFormat Format in which to serve image. Usually: image/png
   * @param {string} queryFormat See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param {OpenLayers.Size} tileSize Tile size in pixels
   * @param {OpenLayers.Projection} crs of the layer
   * @param {Array} subLayers Static sub-layers of the layer
   */
  addLayer(
    layer,
    layerTitle: string,
    path: string,
    imageFormat: string,
    queryFormat: string,
    tileSize,
    crs,
    subLayers: any[]
  ): void {
    let attributions = [];
    if (layer.Attribution) {
      attributions = [
        new Attribution({
          html:
            '<a href="' +
            layer.Attribution.OnlineResource +
            '">' +
            layer.Attribution.Title +
            '</a>',
        }),
      ];
    }
    const layer_class = Tile;
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
      url: this.data.getMapUrl,
      attributions,
      //projection: me.data.crs || me.data.srs,
      params: Object.assign(
        {
          LAYERS: this.data.base
            ? this.createBasemapName()
            : this.createBasemapName(layer),
          INFO_FORMAT: layer.queryable ? queryFormat : undefined,
          FORMAT: imageFormat,
        },
        {}
      ),
      crossOrigin: 'anonymous',
      dimensions: dimensions,
    });
    const new_layer = new layer_class({
      title: layerTitle,
      source,
      removable: true,
      path,
      maxResolution: layer.minScale > 0 ? layer.minScale : undefined,
      base: this.data.base,
    });
    //OlMap.proxifyLayerLoader(new_layer, me.data.useTiles);
    this.hsMapService.map.addLayer(new_layer);
  }

  /**
   * @description Add service and its layers to project TODO
   * @param {string} url Service url
   * @param {Group} group Group layer to which add layer to
   */
  async addService(url: string, group: Group): Promise<void> {
    const wrapper = await this.hsArcgisGetCapabilitiesService.request(url);
    const ol_layers = this.hsArcgisGetCapabilitiesService.service2layers(
      wrapper.response
    );
    ol_layers.forEach((layer) => {
      if (group !== undefined) {
        group.addLayer(layer);
      } else {
        this.hsMapService.addLayer(layer);
      }
    });
  }
}
