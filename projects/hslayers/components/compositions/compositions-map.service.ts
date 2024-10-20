import {Injectable} from '@angular/core';

import {EventsKey} from 'ol/events';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry} from 'ol/geom';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {unByKey} from 'ol/Observable';

import {HsCommonEndpointsService} from 'hslayers-ng/services/endpoints';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsMapCompositionDescriptor} from 'hslayers-ng/types';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsSaveMapService} from 'hslayers-ng/services/save-map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {getHighlighted, setHighlighted} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsMapService {
  extentLayer: VectorLayer<VectorSource<Feature>>;
  pointerMoveListener: EventsKey;

  constructor(
    private hsMapService: HsMapService,
    private hsLayoutService: HsLayoutService,
    private hsSaveMapService: HsSaveMapService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsUtilsService: HsUtilsService,
  ) {
    this.hsLayoutService.mainpanel$.subscribe((which) => {
      if (this.extentLayer) {
        if (
          this.hsLayoutService.mainpanel === 'compositions' ||
          this.hsLayoutService.mainpanel === 'composition'
        ) {
          this.extentLayer.setVisible(true);
        } else {
          this.extentLayer.setVisible(false);
        }
      }
      if (which === 'composition' || which === 'compositions') {
        this.addPointerMoveListener();
      } else if (this.pointerMoveListener) {
        unByKey(this.pointerMoveListener);
      }
    });

    this.extentLayer = this.createNewExtentLayer();
    this.hsMapService.loaded().then((map) => {
      if (
        this.hsLayoutService.mainpanel === 'compositions' ||
        this.hsLayoutService.mainpanel === 'composition'
      ) {
        this.addPointerMoveListener();
      }
      map.addLayer(this.extentLayer);
      this.hsSaveMapService.internalLayers.push(this.extentLayer);
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
   * Create new extent layer
   */
  createNewExtentLayer(): VectorLayer<VectorSource<Feature>> {
    return new VectorLayer({
      properties: {
        title: 'Composition extents',
        showInLayerManager: false,
        removable: false,
      },
      source: new VectorSource(),
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
   * Act on map pointer movement and highlight features under it
   * @param evt
   */
  mapPointerMoved(evt) {
    const featuresUnderMouse = this.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    for (const endpoint of this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.compositions,
    )) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse,
        this.extentLayer,
        endpoint.compositions,
      );
    }
  }

  /**
   * Highlight composition from map feature referencing it
   * @param composition - Composition highlighted from map feature reference
   * @param state - Highlight state
   */
  highlightComposition(
    composition: HsMapCompositionDescriptor,
    state: boolean,
  ) {
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
   * Clear extent layer from all of the features
   */
  clearExtentLayer() {
    this.extentLayer.getSource().clear();
  }

  /**
   * Callback function which gets executed when extent feature
   * is created. It should add the feature to vector layer source
   * @param extentFeature - OpenLayers Feature
   */
  addExtentFeature(extentFeature: Feature<Geometry>): void {
    this.extentLayer.getSource().addFeatures([extentFeature]);
  }

  /**
   * Get feature record and un-highlight the same feature and composition
   * @param feature - Feature under the pointer
   * @param selector - Feature selector
   * @param list - Record list referenced from the feature
   */
  getFeatureRecordAndUnhighlight(feature, selector, list: any[]) {
    const record = list?.find((record) => record.featureId == feature.getId());
    if (
      this.hsMapService.getLayerForFeature(feature) == this.extentLayer &&
      record
    ) {
      setHighlighted(feature, false);
      selector.getFeatures().clear();
      return record;
    }
  }
}
