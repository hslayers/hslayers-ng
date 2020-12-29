import BaseLayer from 'ol/layer/Base';
import {Attribution} from 'ol/control';
import {Group, Image as ImageLayer, Tile} from 'ol/layer';
import {ImageWMS, TileWMS} from 'ol/source';
import {Injectable} from '@angular/core';
import {WMSCapabilities} from 'ol/format';
import {transformExtent} from 'ol/proj';

import {HsAddLayersService} from '../add-layers.service';
import {HsConfig} from '../../../config.service';
import {HsDimensionService} from '../../../common/dimension.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapService} from '../../map/map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {HsWmsGetCapabilitiesService} from '../../../common/wms/get-capabilities.service';
import {Subject} from 'rxjs';
import {addAnchors} from '../../../common/attribution-utils';
import {getPreferedFormat} from '../../../common/format-utils';

@Injectable({providedIn: 'root'})
export class HsAddLayersWmsService {
  getDimensionValues;
  data;
  getWmsCapabilitiesError: Subject<any> = new Subject();
  constructor(
    public hsMapService: HsMapService,
    public hsWmsGetCapabilitiesService: HsWmsGetCapabilitiesService,
    public hsDimensionService: HsDimensionService,
    public hsLayoutService: HsLayoutService,
    public hsLog: HsLogService,
    public hsUtilsService: HsUtilsService,
    public hsConfig: HsConfig,
    public hsAddLayersService: HsAddLayersService
  ) {
    this.data = {
      useResampling: false,
      useTiles: true,
      mapProjection: undefined,
      registerMetadata: true,
      tileSize: 512,
      addUnder: null,
    };
    //TODO: all dimension related things need to be refactored into seperate module
    this.getDimensionValues = hsDimensionService.getDimensionValues;
  }

  /**
   * @param caps
   * @param response
   */
  fillProjections(caps, response): void {
    if (caps.Capability.Layer.CRS !== undefined) {
      this.data.srss = caps.Capability.Layer.CRS;
    } else if (
      caps.Capability.Layer.Layer &&
      caps.Capability.Layer.Layer.length > 0 &&
      caps.Capability.Layer.Layer[0].CRS
    ) {
      this.data.srss = caps.Capability.Layer.Layer[0].CRS;
    } else {
      const oParser = new DOMParser();
      const oDOM = oParser.parseFromString(response, 'application/xml');
      const doc = oDOM.documentElement;
      doc.querySelectorAll('Capability>Layer>CRS').forEach((srs) => {
        this.data.srss.push(srs.innerHTML);
      });
    }
  }

  async capabilitiesReceived(response, layerToSelect: string): Promise<void> {
    try {
      const parser = new WMSCapabilities();
      const caps = parser.read(response);
      this.data.mapProjection = this.hsMapService.map
        .getView()
        .getProjection()
        .getCode()
        .toUpperCase();
      this.data.title = caps.Service.Title;
      this.data.description = addAnchors(caps.Service.Abstract);
      this.data.version = caps.Version || caps.version;
      this.data.image_formats = caps.Capability.Request.GetMap.Format;
      this.data.query_formats = caps.Capability.Request.GetFeatureInfo
        ? caps.Capability.Request.GetFeatureInfo.Format
        : [];
      this.data.exceptions = caps.Capability.Exception;
      this.data.srss = [];
      this.fillProjections(caps, response);
      //TODO: WHY?
      if (this.data.srss.includes('CRS:84')) {
        this.data.srss.splice(this.data.srss.indexOf('CRS:84'), 1);
      }

      if (
        this.hsWmsGetCapabilitiesService.currentProjectionSupported(
          this.data.srss
        )
      ) {
        this.data.srs = this.data.srss.includes(
          this.hsMapService.map.getView().getProjection().getCode()
        )
          ? this.hsMapService.map.getView().getProjection().getCode()
          : this.hsMapService.map
              .getView()
              .getProjection()
              .getCode()
              .toLowerCase();
      } else if (this.data.srss.includes('EPSG:4326')) {
        this.data.srs = 'EPSG:4326';
      } else {
        this.data.srs = this.data.srss[0];
      }
      this.srsChanged();

      this.data.services = this.filterCapabilitiesLayers(caps.Capability.Layer);

      this.data.extent =
        this.data.services[0].EX_GeographicBoundingBox ||
        this.data.services[0].BoundingBox;

      this.selectLayerByName(layerToSelect);

      this.hsDimensionService.fillDimensionValues(caps.Capability.Layer);

      this.data.getMapUrl = this.removePortIfProxified(
        caps.Capability.Request.GetMap.DCPType[0].HTTP.Get.OnlineResource
      );
      this.data.image_format = getPreferedFormat(this.data.image_formats, [
        'image/png; mode=8bit',
        'image/png',
        'image/gif',
        'image/jpeg',
      ]);
      this.data.query_format = getPreferedFormat(this.data.query_formats, [
        'application/vnd.esri.wms_featureinfo_xml',
        'application/vnd.ogc.gml',
        'application/vnd.ogc.wms_xml',
        'text/plain',
        'text/html',
      ]);
      //FIXME: $rootScope.$broadcast('wmsCapsParsed');
    } catch (e) {
      this.getWmsCapabilitiesError.next(e);
    }
  }

  filterCapabilitiesLayers(layers) {
    let tmp = [];
    if (Array.isArray(layers)) {
      tmp = layers;
    } else if (typeof layers == 'object') {
      if (layers.Layer) {
        const layersWithNameParam = layers.Layer.filter((layer) => layer.Name);
        if (layersWithNameParam.length > 0) {
          tmp = layersWithNameParam;
        } else {
          for (const layer of layers.Layer) {
            tmp.push(...layer.Layer.filter((layer) => layer.Name));
          }
        }
      } else {
        tmp = [layers];
      }
    }
    return tmp;
  }

  /**
   * @description Removes extra port which is added to the getMap request when
   * GetCapabilities is queried through proxy. <GetMap><DCPType><HTTP><Get>
   * <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz/cgi-bin/mapserv?map=/home/maps"/>
   * then becomes <GetMap><DCPType><HTTP><Get>
   * <OnlineResource xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="http://gis.lesprojekt.cz:8085/cgi-bin/mapserv?map=/home/maps"/>
   * which is wrong.
   * @param {string} url Url for which to remove port but only when proxified
   * with port in proxy path.
   * @private
   * @returns {string} Url without proxy services port added to it.
   */
  removePortIfProxified(url: string): string {
    if (this.hsConfig.proxyPrefix === undefined) {
      return url;
    }
    const proxyPort = parseInt(
      this.hsUtilsService.getPortFromUrl(this.hsConfig.proxyPrefix)
    );
    if (proxyPort > 0) {
      return url.replace(':' + proxyPort.toString(), '');
    }
    return url;
  }

  /**
   * @param layerToSelect
   */
  selectLayerByName(layerToSelect: string): void {
    if (!layerToSelect) {
      return;
    }
    for (const service of this.data.services) {
      if (service.Layer) {
        for (const layer of service.Layer) {
          if (layer.Name == layerToSelect) {
            layer.checked = true;
            setTimeout(() => {
              const id = `#hs-add-layer-${layer.Name}`;
              const el = this.hsLayoutService.contentWrapper.querySelector(id);
              if (el) {
                el.scrollIntoView();
              }
            }, 1000);
            return;
          }
        }
      } else {
        if (service.Name == layerToSelect) {
          service.checked = true;
          setTimeout(() => {
            const id = `#hs-add-layer-${service.Name}`;
            const el = this.hsLayoutService.contentWrapper.querySelector(id);
            if (el) {
              el.scrollIntoView();
            }
          }, 1000);
        }
      }
    }
  }

  srsChanged(): void {
    this.data.resample_warning = !this.hsWmsGetCapabilitiesService.currentProjectionSupported(
      [this.data.srs]
    );
  }

  /**
   * @function addLayers
   * @description Second step in adding layers to the map, with resampling or without. Loops through the list of layers and calls addLayer.
   * @param {boolean} checkedOnly Add all available layers or only checked ones. checkedOnly=false=all
   */
  addLayers(checkedOnly: boolean): void {
    if (this.data.services === undefined) {
      return;
    }
    for (const layer of this.data.services) {
      this.addLayersRecursively(layer, {checkedOnly: checkedOnly});
    }
    this.hsLayoutService.setMainPanel('layermanager');
    this.zoomToLayers();
  }

  /**
   * @param service
   * @returns {Array}
   */
  getSublayerNames(service): any[] {
    if (service.Layer) {
      return service.Layer.map((l) => {
        const tmp: any = {};
        if (l.Name) {
          tmp.name = l.Name;
        }
        if (l.Title) {
          tmp.title = l.Title;
        }
        if (l.Layer) {
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
    return layer.Layer !== undefined;
  }

  /**
   * @function addLayer
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} path Path name
   * @param {string} imageFormat Format in which to serve image. Usually: image/png
   * @param {string} queryFormat See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param {import('ol/Size')} tileSize Tile size in pixels
   * @param {import('ol/proj/Projection')} crs of the layer
   * @param {Array} subLayers Static sub-layers of the layer
   * @description Add selected layer to map
   */
  addLayer(
    layer,
    layerName: string,
    path: string,
    imageFormat: string,
    queryFormat: string,
    tileSize,
    crs: string,
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
    let layer_class = Tile;
    let source_class = TileWMS;

    if (!this.data.useTiles) {
      layer_class = ImageLayer;
      source_class = ImageWMS;
    }

    let boundingbox = layer.BoundingBox;
    if (crs !== undefined) {
      if (layer.EX_GeographicBoundingBox !== undefined) {
        boundingbox = layer.EX_GeographicBoundingBox;
      }
    } else {
      if (this.data.map_projection != crs) {
        boundingbox = layer.LatLonBoundingBox;
      }
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
    let styles = undefined;
    if (layer.styleSelected) {
      styles = layer.styleSelected;
    } else {
      styles = layer.Style && layer.Style.length > 0 ? layer.Style[0].Name : '';
    }
    const source = new source_class({
      url: this.data.getMapUrl,
      attributions,
      projection: this.data.crs || this.data.srs,
      params: Object.assign(
        {
          LAYERS: layer.Name || layer.Layer[0].Name,
          INFO_FORMAT: layer.queryable ? queryFormat : undefined,
          FORMAT: imageFormat,
          VERSION: this.data.version,
          STYLES: styles,
        },
        this.hsDimensionService.paramsFromDimensions(layer)
      ),
      crossOrigin: 'anonymous',
    });
    const new_layer = new layer_class({
      title: layerName,
      name: layerName,
      source,
      minResolution: layer.MinScaleDenominator,
      maxResolution: layer.MaxScaleDenominator,
      saveState: true,
      removable: true,
      abstract: layer.Abstract,
      MetadataURL: layer.MetadataURL,
      BoundingBox: boundingbox,
      path,
      dimensions: dimensions,
      legends: legends,
      subLayers: subLayers,
    });
    this.hsMapService.proxifyLayerLoader(new_layer, this.data.useTiles);
    this.hsAddLayersService.addLayer(new_layer, this.data.addUnder);
  }

  /**
   * @description Add service and its layers to project
   * @function addService
   * @param {string} url Service url
   * @param addUnder {BaseLayer} OL layer before which to add new layer
   * @param path {string} Folder name with path to group layers
   * @param {Group} group Group layer to which add layer to
   * @param {string} layerName Name of layer to add. If not specified then all layers are added
   */
  addService(
    url: string,
    group: Group,
    layerName: string,
    addUnder?: BaseLayer,
    path?: string
  ): void {
    this.hsWmsGetCapabilitiesService
      .requestGetCapabilities(url)
      .then((resp) => {
        let ol_layers = this.hsWmsGetCapabilitiesService.service2layers(
          resp,
          path
        );
        if (layerName) {
          ol_layers = ol_layers.filter(
            (layer) =>
              layer.get('name') == layerName ||
              (typeof layer.get('name') == 'undefined' && //Backwards compatibility with layman when title==name
                layer.get('title') == layerName)
          );
        }
        ol_layers.forEach((layer) => {
          if (group !== undefined) {
            group.addLayer(layer);
          } else {
            this.hsAddLayersService.addLayer(layer, addUnder);
          }
        });
      });
  }

  private addLayersRecursively(layer, {checkedOnly = true}) {
    if (!checkedOnly || layer.checked) {
      if (layer.Layer === undefined) {
        this.addLayer(
          layer,
          layer.Title.replace(/\//g, '&#47;'),
          this.data.path,
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
          layer.Title.replace(/\//g, '&#47;'),
          this.data.path,
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

  private zoomToLayers() {
    if (this.data.extent) {
      const extent = transformExtent(
        this.data.extent,
        'EPSG:4326',
        this.hsMapService.map.getView().getProjection()
      );
      if (extent) {
        this.hsMapService.map
          .getView()
          .fit(extent, this.hsMapService.map.getSize());
      }
    }
  }
}
