import {Component, OnInit} from '@angular/core';

import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintService} from './print.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';
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
    HsLayoutService: HsLayoutService,
    private hsLanguageService: HsLanguageService,
    private hsSidebarService: HsSidebarService,
    public hsUtilsService: HsUtilsService,
    private hsPrintService: HsPrintService,
    private hsPrintScaleService: HsPrintScaleService,
    private hsPrintLegendService: HsPrintLegendService
  ) {
    super(HsLayoutService);
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton(
      {
        panel: 'print',
        module: 'hs.print',
        order: 10,
        fits: true,
        title: () =>
          this.hsLanguageService.getTranslation(
            'PANEL_HEADER.PRINT',
            undefined,
            this.data.app
          ),
        description: () =>
          this.hsLanguageService.getTranslation(
            'SIDEBAR.descriptions.PRINT',
            undefined,
            this.data.app
          ),
        icon: 'icon-print',
      },
      this.data.app
    );
    this.hsPrintScaleService.init(this.data.app);
    this.hsPrintLegendService.init(this.data.app);
    this.setToDefault();
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
    this.hsPrintScaleService.setToDefaultScale(this.data.app);
    this.hsPrintLegendService.get(this.data.app).loadingExternalImages = false;
  }

  /**
   * Cancel loading print layout image
   */
  cancelLoading(): void {
    this.hsPrintLegendService.get(this.data.app).cancelRequest.next();
  }

  /**
   * Print or preview print layout
   * @param complete - Indicates whether the user wants to print or preview the image
   */
  async printLayout(complete: boolean): Promise<void> {
    await this.hsPrintService.print(this.print, this.data.app, complete);
  }

  /**
   * Download print layout as png image
   */
  async download(): Promise<void> {
    await this.hsPrintService.download(this.print, this.data.app);
  }

  isLoading(): boolean {
    return this.hsPrintLegendService.get(this.data.app).loadingExternalImages;
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
