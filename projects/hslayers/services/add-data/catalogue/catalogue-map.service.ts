import {Injectable} from '@angular/core';

import {EventsKey} from 'ol/events';
import {Feature} from 'ol';
import {Geometry} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {unByKey} from 'ol/Observable';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {
  debounce,
  highlightFeatures,
  createNewExtentLayer,
} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapCompositionDescriptor} from 'hslayers-ng/types';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {setHighlighted} from 'hslayers-ng/common/extensions';

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
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsLayoutService: HsLayoutService,
  ) {
    this.hsLayoutService.mainpanel$.subscribe((which) => {
      if (which === 'addData') {
        this.addPointerMoveListener();
      } else if (this.pointerMoveListener) {
        unByKey(this.pointerMoveListener);
      }
    });

    this.hsMapService.loaded().then((map) => {
      map.addLayer(this.extentLayer);
      this.hsSaveMapService.internalLayers.push(this.extentLayer);
    });
    this.extentLayer = createNewExtentLayer('Datasources extents');
  }

  /**
   * Add debounced pointer move listener
   */
  private addPointerMoveListener() {
    this.pointerMoveListener = this.hsMapService.getMap().on(
      'pointermove',
      debounce((e) => this.mapPointerMoved(e), 50, false, this),
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
      highlightFeatures(featuresUnderMouse, endpoint.layers);
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
