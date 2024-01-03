import {AsyncPipe, NgClass, NgIf} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {HsLayoutService} from 'hslayers-ng/components/layout';
import {HsPanelBaseComponent} from 'hslayers-ng/components/layout';
import {HsPanelHeaderComponent} from 'hslayers-ng/components/layout';
import {HsPrintImprintStylerComponent} from './imprint-styler/imprint-styler.component';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintLegendStylerComponent} from './legend-styler/legend-styler.component';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintScaleStylerComponent} from './scale-styler/scale-styler.component';
import {HsPrintService} from './print.service';
import {HsPrintTextStylerComponent} from './text-styler/text-styler.component';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {PrintModel} from './types/print-object.type';
import {Styler} from './types/styler.type';
import {TranslateCustomPipe} from 'hslayers-ng/components/language';

@Component({
  selector: 'hs-print',
  templateUrl: './print.component.html',
})
export class HsPrintComponent extends HsPanelBaseComponent implements OnInit {
  name = 'print';
  stylers: Styler[] = [
    {name: 'title', visible: false},
    {name: 'legend', visible: false},
    {name: 'imprint', visible: false},
    {name: 'scale', visible: false},
  ];
  print: PrintModel;

  constructor(
    HsLayoutService: HsLayoutService,
    public hsUtilsService: HsUtilsService,
    private hsPrintService: HsPrintService,
    private hsPrintScaleService: HsPrintScaleService,
    private hsPrintLegendService: HsPrintLegendService,
  ) {
    super(HsLayoutService);
  }

  ngOnInit(): void {
    this.setToDefault();
    super.ngOnInit();
  }

  /**
   * Set print object to default values
   */
  setToDefault(): void {
    this.print = {
      titleObj: {
        text: '',
        textStyle: {
          textColor: '',
          textSize: '',
          fontFamily: '',
          fontStyle: '',
          textDraw: null,
          posX: null,
          posY: null,
        },
      },
      scaleObj: {
        include: false,
        scaleType: null,
        scaleBarText: null,
        scaleBarSteps: null,
        scaleUnits: null,
      },
      legendObj: {
        include: false,
        width: null,
        bcColor: '',
        posX: null,
        posY: null,
      },
      imprintObj: {
        include: false,
        author: '',
        abstract: '',
        width: null,
        height: null,
        textStyle: {
          textColor: '',
          bcColor: '',
          textSize: '',
          fontFamily: '',
          fontStyle: '',
          posX: null,
          posY: null,
        },
      },
    };
    this.stylers.forEach((s) => {
      s.visible = false;
    });
    this.hsPrintScaleService.setToDefaultScale();
    this.hsPrintLegendService.loadingExternalImages = false;
  }

  /**
   * Cancel loading print layout image
   */
  cancelLoading(): void {
    this.hsPrintLegendService.cancelRequest.next();
  }

  /**
   * Print or preview print layout
   * @param complete - Indicates whether the user wants to print or preview the image
   */
  async printLayout(complete: boolean): Promise<void> {
    await this.hsPrintService.print(this.print, complete);
  }

  /**
   * Download print layout as png image
   */
  async download(): Promise<void> {
    await this.hsPrintService.download(this.print);
  }

  isLoading(): boolean {
    return this.hsPrintLegendService.loadingExternalImages;
  }

  /**
   * Set styler visibility
   * @param stylerVisible - Selected styler name, that is being toggled
   */
  setStylerVisible(stylerVisible: string): void {
    this.stylers.forEach((s) => {
      if (s.name === stylerVisible) {
        s.visible = !s.visible;
      } else {
        s.visible = false;
      }
    });
  }

  /**
   * Get styler visibility
   * @param stylerVisible - Selected styler name, that is being toggled
   */
  getStylerVisible(stylerVisible: string): boolean {
    return this.stylers.find((s) => s.name === stylerVisible)?.visible ?? false;
  }
}
