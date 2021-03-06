import VectorLayer from 'ol/layer/Vector';
import {Fill, Stroke, Style} from 'ol/style';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsSaveMapService} from '../save-map/save-map.service';
import {Injectable} from '@angular/core';
import {Vector} from 'ol/source';
import {
  getHighlighted,
  getRecord,
  setHighlighted,
} from '../../common/feature-extensions';

@Injectable({
  providedIn: 'root',
})
export class HsCompositionsMapService {
  extentLayer = new VectorLayer({
    title: 'Composition extents',
    showInLayerManager: false,
    source: new Vector(),
    removable: false,
    style: function (feature, resolution) {
      return [
        new Style({
          stroke: new Stroke({
            color: '#005CB6',
            width: getHighlighted(feature) ? 4 : 1,
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0.01)',
          }),
        }),
      ];
    },
  });

  constructor(
    public HsEventBusService: HsEventBusService,
    public HsMapService: HsMapService,
    public HsLayoutService: HsLayoutService,
    private HsSaveMapService: HsSaveMapService
  ) {
    this.HsMapService.loaded().then((map) => {
      map.on('pointermove', (e) => this.mapPointerMoved(e));
      map.addLayer(this.extentLayer);
      this.HsSaveMapService.internalLayers.push(this.extentLayer);
    });

    this.HsEventBusService.mainPanelChanges.subscribe(() => {
      if (this.extentLayer) {
        if (
          this.HsLayoutService.mainpanel === 'composition_browser' ||
          this.HsLayoutService.mainpanel === 'composition'
        ) {
          this.extentLayer.setVisible(true);
        } else {
          this.extentLayer.setVisible(false);
        }
      }
    });
  }

  /**
   * @param evt
   */
  mapPointerMoved(evt) {
    const features = this.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    let somethingDone = false;
    for (const feature of this.extentLayer.getSource().getFeatures()) {
      if (getRecord(feature).highlighted) {
        getRecord(feature).highlighted = false;
        somethingDone = true;
      }
    }
    if (features.length) {
      for (const feature of features) {
        if (!getRecord(feature).highlighted) {
          getRecord(feature).highlighted = true;
          somethingDone = true;
        }
      }
    }
    if (somethingDone) {
      //NOTE: Probably not needed in ng9
      //$timeout(() => {}, 0);
    }
  }

  highlightComposition(composition, state) {
    if (composition.feature) {
      setHighlighted(composition.feature, state);
    }
  }

  clearExtentLayer() {
    this.extentLayer.getSource().clear();
  }

  getFeatureRecordAndUnhighlight(feature, selector) {
    if (
      this.HsMapService.getLayerForFeature(feature) == this.extentLayer &&
      getRecord(feature)
    ) {
      const record = getRecord(feature);
      setHighlighted(feature, false);
      selector.getFeatures().clear();
      return record;
    }
  }
}
