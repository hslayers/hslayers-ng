import {Injectable} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry} from 'ol/geom';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapService} from '../../map/map.service';
import {HsSaveMapService} from '../../save-map/save-map.service';
import {
  getHighlighted,
  setHighlighted,
} from '../../../common/feature-extensions';

class HsAddDataCatalogueMapParams {
  extentLayer: VectorLayer<VectorSource<Geometry>> = new VectorLayer({
    source: new Vector(),
    properties: {
      title: 'Datasources extents',
      showInLayerManager: false,
      removable: false,
    },
    style: function (feature, resolution) {
      return [
        new Style({
          stroke: new Stroke({
            color: '#005CB6',
            width: getHighlighted(feature as Feature<Geometry>) ? 4 : 1,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.01)',
          }),
        }),
      ];
    },
  });
  initRun = false;
}

@Injectable({
  providedIn: 'root',
})
export class HsAddDataCatalogueMapService {
  apps: {
    [id: string]: HsAddDataCatalogueMapParams;
  } = {default: new HsAddDataCatalogueMapParams()};

  constructor(
    public hsMapService: HsMapService,
    public hsLogService: HsLogService,
    private hsSaveMapService: HsSaveMapService,
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService
  ) {}

  get(app: string): HsAddDataCatalogueMapParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsAddDataCatalogueMapParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * @param evt -
   */
  mapPointerMoved(evt, app: string): void {
    const featuresUnderMouse = this.get(app)
      .extentLayer.getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    for (const endpoint of this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.layers
    )) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse,
        this.get(app).extentLayer,
        endpoint.layers
      );
    }
  }

  /**
   * @param map -
   */
  async init(app): Promise<void> {
    const appRef = this.get(app);
    if (!appRef.initRun) {
      await this.hsMapService.loaded(app);
      const map = this.hsMapService.getMap(app);
      map.on('pointermove', (evt) => this.mapPointerMoved(evt, app));
      map.addLayer(appRef.extentLayer);
      this.hsSaveMapService.internalLayers.push(appRef.extentLayer);
      this.apps[app].initRun = true;
    }
  }

  clearExtentLayer(app: string): void {
    this.get(app).extentLayer.getSource().clear();
  }

  /**
   * @param dataset - Configuration of selected datasource (from app config)
   * Remove layer extent features from map
   */
  clearDatasetFeatures(dataset, app: string): void {
    if (dataset.layers) {
      dataset.layers.forEach((val) => {
        try {
          if (val) {
            this.get(app).extentLayer.getSource().clear();
          }
        } catch (ex) {
          this.hsLogService.warn(ex);
        }
      });
    }
  }

  /**
   * Test if it possible to zoom to layer overview (bbox has to be defined
   * in metadata of selected layer)
   * @param layer - TODO
   * @returns Returns if bbox is specified and thus layer is zoomable
   */
  isZoomable(layer): boolean {
    return layer.bbox !== undefined;
  }

  /**
   * Callback function which gets executed when extent feature
   * is created. It should add the feature to vector layer source
   * @param extentFeature - OpenLayers Feature
   */
  addExtentFeature(extentFeature: Feature<Geometry>, app: string): void {
    this.get(app).extentLayer.getSource().addFeatures([extentFeature]);
  }

  highlightLayer(composition, state, app: string): void {
    if (composition.featureId !== undefined) {
      const found = this.get(app)
        .extentLayer.getSource()
        .getFeatureById(composition.featureId);
      if (found) {
        setHighlighted(found, state);
      }
    }
  }

  /**
   * ZoomTo / MoveTo to selected layer overview
   * @param bbox - Bounding box of selected layer
   */
  zoomTo(bbox, app: string): void {
    if (bbox === undefined) {
      return;
    }
    let b = null;
    if (typeof bbox === 'string') {
      b = bbox.split(' ');
    } else if (Array.isArray(bbox)) {
      b = bbox;
    }
    let first_pair = [parseFloat(b[0]), parseFloat(b[1])];
    let second_pair = [parseFloat(b[2]), parseFloat(b[3])];
    first_pair = transform(
      first_pair,
      'EPSG:4326',
      this.hsMapService.getMap(app).getView().getProjection()
    );
    second_pair = transform(
      second_pair,
      'EPSG:4326',
      this.hsMapService.getMap(app).getView().getProjection()
    );
    if (
      isNaN(first_pair[0]) ||
      isNaN(first_pair[1]) ||
      isNaN(second_pair[0]) ||
      isNaN(second_pair[1])
    ) {
      return;
    }
    const extent = [
      first_pair[0],
      first_pair[1],
      second_pair[0],
      second_pair[1],
    ];
    this.hsMapService.fitExtent(extent, app);
  }
}
