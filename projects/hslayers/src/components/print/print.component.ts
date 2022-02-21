import {Component, OnDestroy, OnInit} from '@angular/core';

import {Subject, takeUntil} from 'rxjs';

import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsPrintLegendService} from './print-legend.service';
import {HsPrintScaleService} from './print-scale.service';
import {HsPrintService} from './print.service';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';
import {PrintModel} from './models/print-object.model';
import {Styler} from './types/styler.type';

@Component({
  selector: 'hs-print',
  templateUrl: './print.component.html',
})
export class HsPrintComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy
{
  name = 'print';
  stylers: Styler[] = [
    {name: 'title', visible: false},
    {name: 'legend', visible: false},
    {name: 'imprint', visible: false},
    {name: 'scale', visible: false},
  ];
  print: PrintModel;
  private ngUnsubscribe = new Subject<void>();
  constructor(
    private hsPrintService: HsPrintService,
    private hsPrintScaleService: HsPrintScaleService,
    public hsLayoutService: HsLayoutService,
    public hsLanguageService: HsLanguageService,
    public hsSidebarService: HsSidebarService,
    public hsUtilsService: HsUtilsService,
    private hsPrintLegendService: HsPrintLegendService,
    private hsEventBusService: HsEventBusService
  ) {
    super(hsLayoutService);
    hsSidebarService.buttons.push({
      panel: 'print',
      module: 'hs.print',
      order: 10,
      fits: true,
      title: () => hsLanguageService.getTranslation('PANEL_HEADER.PRINT'),
      description: () =>
        hsLanguageService.getTranslation('SIDEBAR.descriptions.PRINT'),
      icon: 'icon-print',
    });

    this.hsEventBusService.mainPanelChanges
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe(() => {
        this.setToDefault();
      });
  }
  ngOnInit(): void {
    this.setToDefault();
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * Set print object to default values
   */
  setToDefault(): void {
    this.print = {
      titleObj: {
        text: '',
        textStyle: {
          fillColor: '',
          strokeColor: '',
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
        bcColor: null,
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
          fillColor: '',
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
    if (complete) {
      this.setToDefault();
    }
  }

  /**
   * Download print layout as png image
   */
  download(): void {
    this.hsPrintService.download(this.print);
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
