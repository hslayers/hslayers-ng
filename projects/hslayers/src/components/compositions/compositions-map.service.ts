import {Injectable} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry} from 'ol/geom';
import {Vector} from 'ol/source';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {getHighlighted, setHighlighted} from '../../common/feature-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsMapService {
  extentLayer = new VectorLayer({
    properties: {
      title: 'Composition extents',
      showInLayerManager: false,
      removable: false,
    },
    source: new Vector(),
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

  constructor(
    public hsEventBusService: HsEventBusService,
    public hsMapService: HsMapService,
    public hsLayoutService: HsLayoutService,
    private hsSaveMapService: HsSaveMapService,
    public hsLayerUtilsService: HsLayerUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService
  ) {
    this.hsMapService.loaded().then((map) => {
      map.on('pointermove', (e) => this.mapPointerMoved(e));
      map.addLayer(this.extentLayer);
      this.hsSaveMapService.internalLayers.push(this.extentLayer);
    });

    this.hsEventBusService.mainPanelChanges.subscribe(() => {
      if (this.extentLayer) {
        if (
          this.hsLayoutService.mainpanel === 'composition_browser' ||
          this.hsLayoutService.mainpanel === 'composition'
        ) {
          this.extentLayer.setVisible(true);
        } else {
          this.extentLayer.setVisible(false);
        }
      }
    });
  }

  /**
   * @param evt -
   */
  mapPointerMoved(evt) {
    const featuresUnderMouse = this.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    for (const endpoint of this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.compositions
    )) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse,
        this.extentLayer,
        endpoint.compositions
      );
    }
  }

  highlightComposition(composition, state) {
    if (composition.featureId !== undefined) {
      const found = this.extentLayer
        .getSource()
        .getFeatureById(composition.featureId);
      if (found) {
        setHighlighted(found, state);
      }
    }
  }

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
