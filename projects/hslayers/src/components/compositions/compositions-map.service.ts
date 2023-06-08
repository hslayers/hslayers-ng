import {Injectable} from '@angular/core';

import {EventsKey} from 'ol/events';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Geometry} from 'ol/geom';
import {Vector} from 'ol/source';
import {Vector as VectorLayer} from 'ol/layer';
import {Vector as VectorSource} from 'ol/source';
import {unByKey} from 'ol/Observable';

import {HsCommonEndpointsService} from '../../common/endpoints/endpoints.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapCompositionDescriptor} from './models/composition-descriptor.model';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {HsUtilsService} from '../utils/utils.service';
import {getHighlighted, setHighlighted} from '../../common/feature-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsMapService {
  apps: {
    [id: string]: {extentLayer: VectorLayer<VectorSource<Geometry>>};
  } = {};

  pointerMoveListener: EventsKey;
  constructor(
    private hsEventBusService: HsEventBusService,
    private hsMapService: HsMapService,
    private hsLayoutService: HsLayoutService,
    private hsSaveMapService: HsSaveMapService,
    private hsLayerUtilsService: HsLayerUtilsService,
    private hsCommonEndpointsService: HsCommonEndpointsService,
    private hsUtilsService: HsUtilsService
  ) {
    this.hsEventBusService.mainPanelChanges.subscribe(({which, app}) => {
      const appRef = this.get(app);
      if (appRef.extentLayer) {
        if (
          this.hsLayoutService.get(app).mainpanel === 'composition_browser' ||
          this.hsLayoutService.get(app).mainpanel === 'composition'
        ) {
          appRef.extentLayer.setVisible(true);
        } else {
          appRef.extentLayer.setVisible(false);
        }
      }
      if (which === 'composition_browser') {
        this.addPointerMoveListener(app);
      } else if (this.pointerMoveListener) {
        unByKey(this.pointerMoveListener);
      }
    });
  }

  /**
   * Initialize compositions map service data and listeners
   * @param app - App identifier
   */
  init(app: string) {
    const appRef = this.get(app);
    this.hsMapService.loaded(app).then((map) => {
      if (this.hsLayoutService.get(app).mainpanel === 'composition_browser') {
        this.addPointerMoveListener(app);
      }
      map.addLayer(appRef.extentLayer);
      this.hsSaveMapService.internalLayers.push(appRef.extentLayer);
    });
  }

  /**
   * Add debounced pointer move listener
   */
  private addPointerMoveListener(app: string) {
    this.pointerMoveListener = this.hsMapService.getMap(app).on(
      'pointermove',
      this.hsUtilsService.debounce(
        (e) => this.mapPointerMoved(e, app),
        50,
        false,
        this
      )
    );
  }

  /**
   * Create new extent layer
   */
  createNewExtentLayer(): VectorLayer<VectorSource<Geometry>> {
    return new VectorLayer({
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
  }

  /**
   * Get the params saved by the composition map service for the current app
   * @param app - App identifier
   */
  get(app: string) {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = {extentLayer: this.createNewExtentLayer()};
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Act on map pointer movement and highlight features under it
   * @param evt -
   * @param app - App identifier
   */
  mapPointerMoved(evt, app: string) {
    const appRef = this.get(app);
    const featuresUnderMouse = appRef.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    for (const endpoint of this.hsCommonEndpointsService.endpoints.filter(
      (ep) => ep.compositions
    )) {
      this.hsLayerUtilsService.highlightFeatures(
        featuresUnderMouse,
        appRef.extentLayer,
        endpoint.compositions
      );
    }
  }

  /**
   * Highlight composition from map feature referencing it
   * @param composition - Composition highlighted from map feature reference
   * @param state - Highlighte state
   * @param app - App identifier
   */
  highlightComposition(
    composition: HsMapCompositionDescriptor,
    state: boolean,
    app: string
  ) {
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
   * Clear extent layer from all of the features
   * @param app - App identifier
   */
  clearExtentLayer(app: string) {
    this.get(app).extentLayer.getSource().clear();
  }

  /**
   * Callback function which gets executed when extent feature
   * is created. It should add the feature to vector layer source
   * @param extentFeature - OpenLayers Feature
   */
  addExtentFeature(extentFeature: Feature<Geometry>, app: string): void {
    this.get(app).extentLayer.getSource().addFeatures([extentFeature]);
  }

  /**
   * Get feature record and unhighlight the same feature and composition
   * @param feature - Feature under the pointer
   * @param selector - Feature selector
   * @param list - Record list referenced from the feature
   * @param app - App identifier
   */
  getFeatureRecordAndUnhighlight(feature, selector, list: any[], app: string) {
    const record = list?.find((record) => record.featureId == feature.getId());
    if (
      this.hsMapService.getLayerForFeature(feature, app) ==
        this.get(app).extentLayer &&
      record
    ) {
      setHighlighted(feature, false);
      selector.getFeatures().clear();
      return record;
    }
  }
}
