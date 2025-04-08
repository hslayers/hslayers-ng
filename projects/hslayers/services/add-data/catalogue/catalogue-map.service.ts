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
import {HsLayerUtilsService, HsUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapCompositionDescriptor} from 'hslayers-ng/types';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {getHighlighted, setHighlighted} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsAddDataCatalogueMapService {
  extentLayer: VectorLayer<VectorSource<Feature>>;
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
    for (const endpoint of this.hsCommonEndpointsService
      .endpoints()
      .filter((ep) => ep.layers)) {
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
}
