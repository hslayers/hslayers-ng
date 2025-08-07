import {Injectable, inject} from '@angular/core';
import {Subject} from 'rxjs';

import {Cluster, Source, Vector as VectorSource} from 'ol/source';
import {Feature} from 'ol';
import {GeoJSON} from 'ol/format';
import {Layer} from 'ol/layer';

import {HsConfig} from 'hslayers-ng/config';
import {HsLayerDescriptor} from 'hslayers-ng/types';
import {HsLayerSelectorService} from './layer-selector.service';
import {
  isLayerWMS,
  isLayerGeoJSONSource,
  isLayerGPXSource,
  isLayerKMLSource,
  isLayerTopoJSONSource,
  isLayerVectorLayer,
  isLayerWMTS,
  isLayerArcgis,
  isLayerIDW,
  getURL,
  isLayerXYZ,
  getLayerParams,
  isLayerClustered,
} from 'hslayers-ng/services/utils';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {getThumbnail, getTitle} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerUtilsService {
  private hsConfig = inject(HsConfig);
  private hsLayerSelectorService = inject(HsLayerSelectorService);
  private hsMapService = inject(HsMapService);
  private hsLog = inject(HsLogService);

  currentLayer: HsLayerDescriptor;
  layerSelected: Subject<HsLayerDescriptor> = new Subject();

  /**
   * DEPRECATED?
   */
  expandFilter(layer: HsLayerDescriptor, value): void {
    layer.expandFilter = value;
    this.hsLayerSelectorService.currentLayer = layer;
    this.hsLayerSelectorService.select(layer);
  }

  /**
   * DEPRECATED?
   */
  expandInfo(layer: HsLayerDescriptor, value): void {
    layer.expandInfo = value;
  }

  /**
    Generates downloadable GeoJSON for vector layer.
    Features are also transformed into the EPSG:4326 projection
   */
  saveGeoJson(): void {
    const geojsonParser = new GeoJSON();
    const olLayer = this.hsLayerSelectorService.currentLayer.layer;
    const geojson = geojsonParser.writeFeatures(
      (isLayerClustered(olLayer)
        ? (olLayer.getSource() as Cluster<Feature>).getSource()
        : (olLayer.getSource() as VectorSource)
      ).getFeatures(),
      {
        dataProjection: 'EPSG:4326',
        featureProjection: this.hsMapService.getCurrentProj(),
      },
    );
    const file = new Blob([geojson], {type: 'application/json'});

    const a = document.createElement('a'),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = getTitle(
      this.hsLayerSelectorService.currentLayer.layer,
    ).replace(/\s/g, '');
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

  /**
   * Triage of layer source type and format.
   * Only the commonly used values are listed here, it shall be probably extended in the future.
   * @returns Short description of source type: 'WMS', 'XYZ', 'vector (GeoJSON)' etc.
   */
  async getLayerSourceType(layer: Layer<Source>): Promise<string> {
    if (await isLayerKMLSource(layer)) {
      return `vector (KML)`;
    }
    if (await isLayerGPXSource(layer)) {
      return `vector (GPX)`;
    }
    if (await isLayerGeoJSONSource(layer)) {
      return `vector (GeoJSON)`;
    }
    if (await isLayerTopoJSONSource(layer)) {
      return `vector (TopoJSON)`;
    }
    if (isLayerVectorLayer(layer)) {
      return 'vector';
    }
    if (isLayerWMTS(layer)) {
      return 'WMTS';
    }
    if (isLayerWMS(layer)) {
      return 'WMS';
    }
    if (isLayerXYZ(layer)) {
      return 'XYZ';
    }
    if (isLayerArcgis(layer)) {
      return 'ArcGIS';
    }

    if (isLayerIDW(layer)) {
      return 'IDW';
    }
    this.hsLog.warn(
      `Cannot decide a type of source of layer ${getTitle(layer)}`,
    );
    return 'unknown type';
  }

  /**
   * Gets the URL provided in the layer's source, if it is not a data blob or undefined
   * @returns URL provided in the layer's source or 'memory'
   */
  getLayerSourceUrl(layer: Layer<Source>): string {
    const url = getURL(layer)?.split('?')[0]; //better stripe out any URL params
    if (!url || url.startsWith('data:')) {
      return 'memory';
    }
    return url;
  }

  checkLayerHealth(layer: Layer<Source>): void {
    if (isLayerWMS(layer)) {
      if (getLayerParams(layer).LAYERS == undefined) {
        this.hsLog.warn('Layer', layer, 'is missing LAYERS parameter');
      }
    }
  }

  /**
   * Function for adding baselayer thumbnail visible in basemap gallery.
   * @param layer - Base layer added to map
   */
  getImage(layer: Layer<Source>): string {
    const thumbnail = getThumbnail(layer);
    if (thumbnail) {
      if (thumbnail.length > 10) {
        return thumbnail;
      }
      return this.hsConfig.assetsPath + 'img/' + thumbnail;
    }
    return this.hsConfig.assetsPath + 'img/default.png';
  }
}
