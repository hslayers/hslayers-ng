import {Component} from '@angular/core';

import {Circle, Fill, Stroke, Style} from 'ol/style';
import {HsDrawService} from './draw.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsQueryBaseService} from '../query/query-base.service';
import {getTitle} from '../../common/layer-extensions';

@Component({
  selector: 'hs-draw',
  templateUrl: './partials/draw.html',
})
export class HsDrawComponent {
  onFeatureSelected: any;
  onFeatureDeselected: any;
  layersExpanded: boolean;
  snapLayersExpanded: boolean;
  drawToolbarExpanded: any;
  opacity = 0.2;
  linewidth = 1;
  fillcolor: any = {'background-color': 'rgba(0, 153, 255, 1)'};
  onlyMineFilterVisible = false;
  getTitle = getTitle;

  constructor(
    public HsDrawService: HsDrawService,
    public HsLayoutService: HsLayoutService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public HsQueryBaseService: HsQueryBaseService
  ) {
    this.HsDrawService.init();
  }

  activateDrawing(withStyle?): void {
    this.HsDrawService.activateDrawing({
      changeStyle: withStyle ? () => this.changeStyle() : undefined,
    });
  }

  setType(what): void {
    const type = this.HsDrawService.setType(what);
    if (type) {
      this.activateDrawing(this.HsLayoutService.panelVisible('draw'));
    }
  }

  selectLayer(layer): void {
    this.HsDrawService.selectLayer(layer);
    this.layersExpanded = false;
  }

  changeSnapSource(layer): void {
    this.HsDrawService.changeSnapSource(layer);
    this.snapLayersExpanded = false;
  }

  updateStyle(): void {
    this.HsDrawService.updateStyle(() => this.changeStyle());
  }

  /**
   * @function changeStyle
   * @memberof HsDrawComponent
   * @param {Event} e optional parameter passed when changeStyle is called
   * for 'ondrawend' event features
   * @description Dynamically create draw feature style according to parameters selected in
   * hs.styler.colorDirective
   * @returns {Array} Array of style definitions
   */
  changeStyle(e = null): Style {
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
  }

  drawStyle() {
    return {
      'background-color':
        this.fillcolor['background-color'].slice(0, -2) + this.opacity + ')',
      border: this.linewidth + 'px solid ' + this.fillcolor['background-color'],
    };
  }
}
