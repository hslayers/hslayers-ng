import {Component, OnDestroy} from '@angular/core';
import {Subject} from 'rxjs';

import {Circle, Fill, Stroke, Style} from 'ol/style';

import {HsDrawService} from 'hslayers-ng/shared/draw';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLayerUtilsService} from 'hslayers-ng/shared/utils';
import {HsLayoutService} from 'hslayers-ng/shared/layout';
import {getTitle} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-draw-panel',
  templateUrl: './draw-panel.component.html',
  styleUrls: ['./draw-panel.component.scss'],
})
export class DrawPanelComponent implements OnDestroy {
  onFeatureSelected: any;
  onFeatureDeselected: any;
  drawToolbarExpanded: any;
  opacity = 0.2;
  linewidth = 1;
  fillcolor: any = {'background-color': 'rgba(0, 153, 255, 1)'};
  onlyMineFilterVisible = false;
  getTitle = getTitle;
  sidebarPosition: string;
  private end = new Subject<void>();

  constructor(
    public HsDrawService: HsDrawService,
    public HsLayerUtilsService: HsLayerUtilsService,
    public hsLayoutService: HsLayoutService,
    public HsLanguageService: HsLanguageService,
  ) {}
  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

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
