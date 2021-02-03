import VectorLayer from 'ol/layer/Vector';
import {Fill, Stroke, Style} from 'ol/style';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {Injectable} from '@angular/core';
import {Vector} from 'ol/source';

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
            width: feature.get('highlighted') ? 4 : 1,
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
    public HsLayoutService: HsLayoutService
  ) {
    this.HsMapService.loaded().then((map) => {
      map.on('pointermove', (e) => this.mapPointerMoved(e));
      map.addLayer(this.extentLayer);
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
      if (feature.get('record').highlighted) {
        feature.get('record').highlighted = false;
        somethingDone = true;
      }
    }
    if (features.length) {
      for (const feature of features) {
        if (!feature.get('record').highlighted) {
          feature.get('record').highlighted = true;
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
      composition.feature.set('highlighted', state);
    }
  }

  clearExtentLayer() {
    this.extentLayer.getSource().clear();
  }

  getFeatureRecordAndUnhighlight(feature, selector) {
    if (feature.get('is_hs_composition_extent') && feature.get('record')) {
      const record = feature.get('record');
      feature.set('highlighted', false);
      selector.getFeatures().clear();
      return record;
    }
  }
}
