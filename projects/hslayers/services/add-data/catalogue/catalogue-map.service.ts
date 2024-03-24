import {Injectable} from '@angular/core';

import {EventsKey} from 'ol/events';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {transform} from 'ol/proj';
import {unByKey} from 'ol/Observable';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapCompositionDescriptor} from 'hslayers-ng/types';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {getHighlighted, setHighlighted} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataCatalogueMapService {
  extentLayer: VectorLayer<VectorSource>;
  pointerMoveListener: EventsKey;

  constructor(
    public hsMapService: HsMapService,
    public hsLogService: HsLogService,
    private hsSaveMapService: HsSaveMapService,
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsLayoutService: HsLayoutService,
    private hsUtilsService: HsUtilsService,
  ) {
    this.hsLayoutService.mainpanel$.subscribe((which) => {
      if (which === 'addData') {
        this.addPointerMoveListener();
      } else if (this.pointerMoveListener) {
        unByKey(this.pointerMoveListener);
      }
    });

    this.hsMapService.loaded().then((map) => {
      if (this.hsLayoutService.mainpanel === 'addData') {
        this.addPointerMoveListener();
      }
      map.addLayer(this.extentLayer);
      this.hsSaveMapService.internalLayers.push(this.extentLayer);
    });

    this.extentLayer = new VectorLayer({
      source: new VectorSource(),
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
  }

  /**
   * Add debounced pointer move listener
   */
  private addPointerMoveListener() {
    this.pointerMoveListener = this.hsMapService.getMap().on(
      'pointermove',
      this.hsUtilsService.debounce(
        (e) => this.mapPointerMoved(e),
        50,
        false,
        this,
      ),
    );
  }

  /**
   * @param evt - Event object
   */
  mapPointerMoved(evt): void {
    const featuresUnderMouse = this.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    for (const endpoint of this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.layers,
    )) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse,
        this.extentLayer,
        endpoint.layers,
      );
    }
  }

  clearExtentLayer(): void {
    this.extentLayer.getSource().clear();
  }

  /**
   * Removes layer extent features from map
   * @param dataset - Configuration of selected datasource (from app config)
   */
  clearDatasetFeatures(dataset): void {
    if (dataset.layers) {
      dataset.layers.forEach((val) => {
        try {
          if (val) {
            this.extentLayer.getSource().clear();
          }
        } catch (ex) {
          this.hsLogService.warn(ex);
        }
      });
    }
  }

  /**
   * Callback function which gets executed when extent feature
   * is created. It should add the feature to vector layer source
   * @param extentFeature - OpenLayers Feature
   */
  addExtentFeature(extentFeature: Feature<Geometry>): void {
    this.extentLayer.getSource().addFeatures([extentFeature]);
  }

  highlightLayer(
    composition: HsMapCompositionDescriptor,
    state: boolean,
  ): void {
    if (composition.featureId !== undefined) {
      const found = this.extentLayer
        .getSource()
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
  zoomTo(bbox): void {
    if (!bbox) {
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
      this.hsMapService.getMap().getView().getProjection(),
    );
    second_pair = transform(
      second_pair,
      'EPSG:4326',
      this.hsMapService.getMap().getView().getProjection(),
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
    this.hsMapService.fitExtent(extent);
  }
}
