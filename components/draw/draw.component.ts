import {Component} from '@angular/core';

import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Circle, Fill, Icon, Stroke, Style} from 'ol/style';

import {HsConfig} from '../../config.service';
import {HsDrawService} from './draw.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service.js';
import {HsMapService} from '../map/map.service.js';

@Component({
  selector: 'hs-draw',
  template: require('./partials/draw.html'),
})
export class HsDrawComponent {
  onFeatureSelected: any;
  onFeatureDeselected: any;
  layersExpanded: boolean;
  drawToolbarExpanded: any;
  useIndividualStyle = true;
  opacity = 0.2;
  linewidth = 1;
  fillcolor: any = {'background-color': 'rgba(0, 153, 255, 1)'};

  constructor(
    private HsMapService: HsMapService,
    private HsDrawService: HsDrawService,
    private HsConfig: HsConfig,
    private HsLayerUtilsService: HsLayerUtilsService,
    private HsLayoutService: HsLayoutService
  ) {}

  activateDrawing(withStyle) {
    this.HsDrawService.activateDrawing({
      changeStyle: withStyle ? this.changeStyle : undefined,
    });
  }
  setType(what) {
    const type = this.HsDrawService.setType(what);
    if (type) {
      this.activateDrawing(
        this.HsLayoutService.panelVisible('draw') && this.useIndividualStyle
      );
    }
  }

  selectLayer(layer) {
    if (layer != this.HsDrawService.selectedLayer) {
      this.HsDrawService.selectedLayer = layer;
      this.HsDrawService.changeDrawSource();
    }
    this.layersExpanded = false;
  }

  updateStyle() {
    this.HsDrawService.updateStyle(this.changeStyle);
  }
  /**
   * @function changeStyle
   * @memberOf HsDrawController
   * @param {Event} e optional parameter passed when changeStyle is called
   * for 'ondrawend' event features
   * @description Dynamically create draw feature style according to parameters selected in
   * hs.styler.colorDirective
   * @returns {Array} Array of style definitions
   */
  changeStyle = (e = null) => {
    const newStyle = new Style({
      stroke: new Stroke({
        color: this.fillcolor['background-color'],
        width: this.linewidth,
      }),
      fill: new Fill({
        color:
          this.fillcolor['background-color'].slice(0, -2) + this.opacity + ')',
      }),
      image: new Circle({
        radius: 5,
        fill: new Fill({
          color:
            this.fillcolor['background-color'].slice(0, -2) +
            this.opacity +
            ')',
        }),
        stroke: new Stroke({
          color: this.fillcolor['background-color'],
          width: this.linewidth,
        }),
      }),
    });
    return newStyle;
  };
  drawStyle() {
    return {
      'background-color':
        this.fillcolor['background-color'].slice(0, -2) + this.opacity + ')',
      border: this.linewidth + 'px solid ' + this.fillcolor['background-color'],
    };
  }
}