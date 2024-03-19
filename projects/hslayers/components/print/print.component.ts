import {Component, OnInit} from '@angular/core';

import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintService} from './print.service';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {PrintModel} from './types/print-object.type';
import {Styler} from './types/styler.type';

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
    public hsUtilsService: HsUtilsService,
    private hsPrintService: HsPrintService,
    private hsPrintScaleService: HsPrintScaleService,
    private hsPrintLegendService: HsPrintLegendService,
  ) {
    super();
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
          textColor: 'black',
          textSize: '30px',
          fontFamily: 'Times New Roman',
          fontStyle: 'normal',
          textDraw: 'fill',
          posX: 'center',
          posY: 'top',
        },
      },
      scaleObj: {
        include: false,
        scaleType: 'scaleline',
        scaleBarText: null,
        scaleBarSteps: 4,
        scaleUnits: 'metric',
      },
      legendObj: {
        include: false,
        width: 200,
        bcColor: 'white',
        posX: 'right',
        posY: 'bottom',
      },
      imprintObj: {
        include: false,
        author: '',
        abstract: '',
        width: 100,
        height: 50,
        textStyle: {
          textColor: 'black',
          bcColor: 'transparent',
          textSize: '12px',
          fontFamily: 'Times New Roman',
          fontStyle: 'normal',
          posX: 'center',
          posY: 'bottom',
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
