import Overlay from 'ol/Overlay';
import {Component} from '@angular/core';
import {HsEventBusService} from '../core/event-bus.service';
import {HsMapService} from '../map/map.service';
import {HsQueryBaseService} from './query-base.service';
import {HsQueryVectorService} from './query-vector.service';

@Component({
  selector: 'hs.query.feature',
  template: require('./partials/feature-popup.html'),
})
export class HsQueryFeaturePopupComponent {
  constructor(
    private HsQueryBaseService: HsQueryBaseService,
    private HsMapService: HsMapService,
    private HsQueryVectorService: HsQueryVectorService,
    private HsEventBusService: HsEventBusService
  ) {
    const hoverPopupElement = $element[0];
    this.HsQueryBaseService.hoverPopup = new Overlay({
      element: hoverPopupElement,
    });

    HsEventBusService.olMapLoads.subscribe((map) => {
      map.addOverlay(this.HsQueryBaseService.hoverPopup);
    });
  }

  popupVisible() {
    return {
      'visibility':
        this.HsQueryBaseService.featuresUnderMouse.length > 0
          ? 'visible'
          : 'hidden',
    };
  }

  isClustered(feature) {
    return feature.get('features') && feature.get('features').length > 0;
  }

  serializeFeatureName(feature) {
    if (feature.get('name')) {
      return feature.get('name');
    }
    if (feature.get('title')) {
      return feature.get('title');
    }
    if (feature.get('label')) {
      return feature.get('label');
    }
  }

  isFeatureRemovable(feature) {
    return this.HsQueryVectorService.isFeatureRemovable(feature);
  }

  isLayerEditable(layer) {
    return this.HsQueryVectorService.isLayerEditable(layer);
  }

  async removeFeature(feature) {
    const dialog = $injector.get('HsConfirmDialog');
    const confirmed = await dialog.show(
      gettext('Really delete this feature?'),
      gettext('Confirm delete')
    );
    if (confirmed == 'yes') {
      this.HsQueryVectorService.removeFeature(feature);
      this.HsQueryBaseService.featuresUnderMouse = [];
    }
  }

  async clearLayer(layer) {
    const dialog = $injector.get('HsConfirmDialog');
    const confirmed = await dialog.show(
      gettext('Really delete all features from layer "{0}"?').replace(
        '{0}',
        layer.get('title')
      ),
      gettext('Confirm delete')
    );
    if (confirmed == 'yes') {
      if (layer.getSource().getSource) {
        //Clear clustered?
        layer.getSource().getSource().clear();
      }
      layer.getSource().clear();
      this.HsQueryBaseService.featuresUnderMouse = [];
    }
  }
}
