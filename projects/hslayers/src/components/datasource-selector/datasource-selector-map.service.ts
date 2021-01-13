import {Injectable} from '@angular/core';

import VectorLayer from 'ol/layer/Vector';
import {Feature} from 'ol';
import {Fill, Stroke, Style} from 'ol/style';
import {Vector} from 'ol/source';
import {transform} from 'ol/proj';

import {HsLogService} from '../../common/log/log.service';
import {HsMapService} from '../map/map.service';

@Injectable({
  providedIn: 'root',
})
export class HsDatasourcesMapService {
  extentLayer: VectorLayer = new VectorLayer({
    title: 'Datasources extents',
    show_in_manager: false,
    source: new Vector(),
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
    public hsMapService: HsMapService,
    public hsLogService: HsLogService
  ) {
    this.hsMapService.loaded().then((map) => this.init(map));
  }

  /**
   * @param evt
   */
  mapPointerMoved(evt): void {
    const features = this.extentLayer
      .getSource()
      .getFeaturesAtCoordinate(evt.coordinate);
    this.extentLayer
      .getSource()
      .getFeatures()
      .forEach((feature) => {
        if (feature.get('record').highlighted) {
          feature.get('record').highlighted = false;
        }
      });
    if (features.length) {
      features.forEach((feature) => {
        if (!feature.get('record').highlighted) {
          feature.get('record').highlighted = true;
        }
      });
    }
  }

  /**
   * @param map
   */
  init(map): void {
    map.on('pointermove', (evt) => this.mapPointerMoved(evt));
    map.addLayer(this.extentLayer);
  }

  clearExtentLayer(): void {
    this.extentLayer.getSource().clear();
  }

  /**
   * @function clearDatasetFeatures
   * @memberof HsDatasourceBrowserService
   * @param {object} dataset Configuration of selected datasource (from app config)
   * @description Remove layer extent features from map
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
   * @function isZoomable
   * @param {unknown} layer TODO
   * @returns {boolean} Returns if bbox is specified and thus layer is zoomable
   * @description Test if it possible to zoom to layer overview (bbox has to be defined
   * in metadata of selected layer)
   */
  isZoomable(layer): boolean {
    return layer.bbox !== undefined;
  }

  /**
   * @function addExtentFeature
   * @param {Feature} extentFeature Openlayers Feature
   * @description Callback function which gets executed when extent feature
   * is created. It should add the feature to vector layer source
   */
  addExtentFeature(extentFeature: Feature): void {
    this.extentLayer.getSource().addFeatures([extentFeature]);
  }

  highlightComposition(composition, state): void {
    if (composition.feature !== undefined) {
      composition.feature.set('highlighted', state);
    }
  }

  /**
   * @function zoomTo
   * @param {string} bbox Bounding box of selected layer
   * @description ZoomTo / MoveTo to selected layer overview
   */
  zoomTo(bbox): void {
    if (bbox === undefined) {
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
    const currentProj = this.hsMapService.getCurrentProj();
    first_pair = transform(first_pair, 'EPSG:4326', currentProj);
    second_pair = transform(second_pair, 'EPSG:4326', currentProj);
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
    this.hsMapService.map
      .getView()
      .fit(extent, this.hsMapService.map.getSize());
  }
}
