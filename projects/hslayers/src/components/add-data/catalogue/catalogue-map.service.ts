import {Injectable} from '@angular/core';

import {EventsKey} from 'ol/events';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry} from 'ol/geom';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {transform} from 'ol/proj';
import {unByKey} from 'ol/Observable';

import {HsCommonEndpointsService} from '../../../common/endpoints/endpoints.service';
import {HsEventBusService} from '../../core/event-bus.service';
import {HsLayerUtilsService} from '../../utils/layer-utils.service';
import {HsLayoutService} from '../../layout/layout.service';
import {HsLogService} from '../../../common/log/log.service';
import {HsMapCompositionDescriptor} from '../../compositions/models/composition-descriptor.model';
import {HsMapService} from '../../map/map.service';
import {HsSaveMapService} from '../../save-map/save-map.service';
import {HsUtilsService} from '../../utils/utils.service';
import {
  getHighlighted,
  setHighlighted,
} from '../../../common/feature-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataCatalogueMapService {
  extentLayer: VectorLayer<VectorSource<Geometry>>;
  pointerMoveListener: EventsKey;

  constructor(
    public hsMapService: HsMapService,
    public hsLogService: HsLogService,
    private hsSaveMapService: HsSaveMapService,
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsEventBusService: HsEventBusService,
    private hsLayoutService: HsLayoutService,
    private hsUtilsService: HsUtilsService,
  ) {
    this.hsEventBusService.mainPanelChanges.subscribe((which) => {
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
