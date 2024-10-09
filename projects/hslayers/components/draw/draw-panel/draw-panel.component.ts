import {Component} from '@angular/core';

import {Circle, Fill, Stroke, Style} from 'ol/style';

import {AsyncPipe, NgClass, NgForOf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {HsDrawService} from 'hslayers-ng/services/draw';
import {
  HsLanguageService,
  TranslateCustomPipe,
} from 'hslayers-ng/services/language';
import {HsLayerUtilsService} from 'hslayers-ng/services/utils';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {NgbDropdownModule} from '@ng-bootstrap/ng-bootstrap';
import {getTitle} from 'hslayers-ng/common/extensions';

interface DrawToolDefinition {
  type: string;
  icon: string;
  title: string;
}

@Component({
  selector: 'hs-draw-panel',
  templateUrl: './draw-panel.component.html',
  styleUrls: ['./draw-panel.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    TranslateCustomPipe,
    NgClass,
    NgForOf,
    FormsModule,
    NgbDropdownModule,
  ],
})
export class DrawPanelComponent {
  onFeatureSelected: any;
  onFeatureDeselected: any;
  drawToolbarExpanded: any;
  opacity = 0.2;
  linewidth = 1;
  fillcolor: any = {'background-color': 'rgba(0, 153, 255, 1)'};
  onlyMineFilterVisible = false;
  getTitle = getTitle;
  sidebarPosition: string;

  drawTools: DrawToolDefinition[] = [
    {type: 'Point', icon: 'icon-pin', title: 'COMMON.point'},
    {type: 'Polygon', icon: 'icon-polygonlasso', title: 'COMMON.polygon'},
    {type: 'LineString', icon: 'icon-line', title: 'COMMON.line'},
    {type: 'Circle', icon: 'icon-circleloaderfull', title: 'COMMON.circle'},
  ];

  constructor(
    public HsDrawService: HsDrawService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService,
  ) {}

  translateString(module: string, text: string): string {
    return this.HsLanguageService.getTranslationIgnoreNonExisting(module, text);
  }

  changeSnapSource(layer): void {
    this.HsDrawService.changeSnapSource(layer);
  }

  setType(what): void {
    const type = this.HsDrawService.setType(what);
    if (type) {
      this.activateDrawing(this.hsLayoutService.mainpanel === 'draw');
    }
  }

  activateDrawing(withStyle?): void {
    this.HsDrawService.activateDrawing({
      changeStyle: withStyle ? () => this.changeStyle() : undefined,
    });
  }

  selectLayer(layer): void {
    this.HsDrawService.selectLayer(layer);
  }

  updateStyle(): void {
    this.HsDrawService.updateStyle(() => this.changeStyle());
  }

  /**
   * Dynamically create draw feature style according to parameters selected in
   * hs.styler.colorDirective
   * @param {Event} e - optional parameter passed when changeStyle is called
   * for 'ondrawend' event features
   * @returns Style definition
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
