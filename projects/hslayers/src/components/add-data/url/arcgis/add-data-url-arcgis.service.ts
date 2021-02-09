import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {Attribution} from 'ol/control';
import {Group} from 'ol/layer';
import {Tile} from 'ol/layer';
import {TileArcGISRest} from 'ol/source';

import {HsArcgisGetCapabilitiesService} from '../../../../common/arcgis/get-capabilities.service';
import {HsDimensionService} from '../../../../common/dimension.service';
import {HsLayoutService} from '../../../layout/layout.service';
import {HsMapService} from '../../../map/map.service';
import {HsUtilsService} from '../../../utils/utils.service';
import {addAnchors} from '../../../../common/attribution-utils';
import {getPreferedFormat} from '../../../../common/format-utils';

@Injectable({providedIn: 'root'})
export class HsAddDataArcGisService {
  data;
  arcgisCapsParsed = new Subject();
  arcgisCapsParseError = new Subject();

  constructor(
    public hsArcgisGetCapabilitiesService: HsArcgisGetCapabilitiesService,
    public hsDimensionService: HsDimensionService,
    public hsLayoutService: HsLayoutService,
    public hsMapService: HsMapService,
    public hsUtilsService: HsUtilsService
  ) {
    this.data = {
      useResampling: false,
      useTiles: true,
      mapProjection: undefined,
      registerMetadata: true,
      tileSize: 512,
    };
  }

  //TODO: all dimension related things need to be refactored into seperate module
  getDimensionValues = this.hsDimensionService.getDimensionValues;

  capabilitiesReceived(response, layerToSelect: string): void {
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
      this.selectLayerByName(layerToSelect);

      this.data.image_format = getPreferedFormat(this.data.image_formats, [
        'PNG32',
        'PNG',
        'GIF',
        'JPG',
      ]);
      this.data.query_format = getPreferedFormat(this.data.query_formats, [
        'geoJSON',
        'JSON',
      ]);
      this.arcgisCapsParsed.next();
    } catch (e) {
      this.arcgisCapsParseError.next(e);
    }
  }

  /**
   * @param layerToSelect
   */
  selectLayerByName(layerToSelect): void {
    if (layerToSelect) {
      this.data.services.forEach((service) => {
        service.Layer.forEach((layer) => {
          if (layer.name == layerToSelect) {
            layer.checked = true;
          }
          setTimeout(() => {
            const id = `#hs-add-layer-${layer.Name}`;
            const el = this.hsLayoutService.contentWrapper.querySelector(id);
            if (el) {
              el.scrollIntoView();
            }
          }, 1000);
        });
      });
    }
  }

  srsChanged(): void {
    setTimeout(() => {
      this.data.resample_warning = !this.hsArcgisGetCapabilitiesService.currentProjectionSupported(
        [this.data.srs]
      );
    }, 0);
  }

  /**
   * @function addLayers
   * @description Seconds step in adding layers to the map, with resampling or without. Lops through the list of layers and calls addLayer.
   * @param {boolean} checked - Add all available layersor ony checked ones. Checked=false=all
   */
  addLayers(checked: boolean): void {
    /**
     * @param layer
     */
    function recurse(layer) {
      if (!checked || layer.checked) {
        if (layer.Layer === undefined) {
          this.addLayer(
            layer,
            layer.name.replace(/\//g, '&#47;'),
            this.hsUtilsService.undefineEmptyString(this.data.path),
            this.data.image_format,
            this.data.query_format,
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
            this.getSublayerNames(layer)
          );
        }
      }
      if (layer.Layer) {
        for (const sublayer of layer.Layer) {
          recurse(sublayer);
        }
      }
    }
    for (const layer of this.data.services) {
      recurse(layer);
    }
    this.hsLayoutService.setMainPanel('layermanager');
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
   * @function addLayer
   * @description Add selected layer to map
   * @param {object} layer capabilities layer object
   * @param {string} layerName layer name in the map
   * @param {string} path Path name
   * @param {string} imageFormat Format in which to serve image. Usually: image/png
   * @param {string} queryFormat See info_format in https://docs.geoserver.org/stable/en/user/services/wms/reference.html
   * @param {OpenLayers.Size} tileSize Tile size in pixels
   * @param {OpenLayers.Projection} crs of the layer
   * @param {Array} subLayers Static sub-layers of the layer
   */
  addLayer(
    layer,
    layerName: string,
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
          LAYERS: `show:${layer.id}`,
          INFO_FORMAT: layer.queryable ? queryFormat : undefined,
          FORMAT: imageFormat,
        },
        {}
      ),
      crossOrigin: 'anonymous',
      dimensions: dimensions,
    });
    const new_layer = new layer_class({
      title: layerName,
      source,
      removable: true,
      path,
    });
    //OlMap.proxifyLayerLoader(new_layer, me.data.useTiles);
    this.hsMapService.map.addLayer(new_layer);
  }

  /**
   * @function addService
   * @description Add service and its layers to project TODO
   * @param {string} url Service url
   * @param {Group} group Group layer to which add layer to
   */
  addService(url: string, group: Group): void {
    this.hsArcgisGetCapabilitiesService
      .requestGetCapabilities(url)
      .then((resp) => {
        const ol_layers = this.hsArcgisGetCapabilitiesService.service2layers(
          resp
        );
        ol_layers.forEach((layer) => {
          if (group !== undefined) {
            group.addLayer(layer);
          } else {
            this.hsMapService.addLayer(layer);
          }
        });
      });
  }
}
