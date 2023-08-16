import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Subject, delay, takeUntil} from 'rxjs';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from './layout.service';
import {HsLogService} from '../../common/log/log.service';
import {HsMapHostDirective} from './map-host.directive';
import {HsOverlayPanelContainerService} from './overlay-panel-container.service';
import {HsPanelContainerService} from './panels/panel-container.service';
import {HsShareUrlService} from '../permalink/share-url.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-layout',
  templateUrl: './layout.component.html',
})
export class HsLayoutComponent implements AfterViewInit, OnInit, OnDestroy {
  @ViewChild('hslayout') hslayout: ElementRef;
  @ViewChild(HsMapHostDirective, {static: true})
  mapHost: HsMapHostDirective;
  panelSpaceWidth: number;
  sidebarPosition: string;
  sidebarVisible: boolean;
  private end = new Subject<void>();
  panelVisible(which, scope?): boolean {
    return this.HsLayoutService.panelVisible(which, scope);
  }

  panelEnabled(which, status?): boolean {
    return this.HsLayoutService.panelEnabled(which, status);
  }

  constructor(
    private elementRef: ElementRef,
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    private hsLog: HsLogService,
    public HsEventBusService: HsEventBusService,
    private HsUtilsService: HsUtilsService,
    public HsPanelContainerService: HsPanelContainerService,
    public HsOverlayPanelContainerService: HsOverlayPanelContainerService,
    private hsShareUrlService: HsShareUrlService,
  ) {}

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.HsLayoutService.layoutElement =
      this.elementRef.nativeElement.querySelector('.hsl');

    this.HsLayoutService.contentWrapper =
      this.elementRef.nativeElement.querySelector('.hs-content-wrapper');

    if (window.innerWidth < 600 && this.HsUtilsService.runningInBrowser()) {
      const viewport = document.querySelector('meta[name="viewport"]');
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no',
      );
    }

    const appInUrl = this.hsShareUrlService.getParamValue('app');
    if (appInUrl != undefined) {
      this.HsLayoutService.scrollTo(this.elementRef);
    }

    this.HsEventBusService.layoutLoads.next({
      element: this.elementRef.nativeElement,
      innerElement: '.hs-map-space',
    });
    this.HsLayoutService.mapSpaceRef.next(this.mapHost.viewContainerRef);
    this.HsLayoutService.panelSpaceWidth
      .pipe(takeUntil(this.end))
      .subscribe((width) => {
        this.panelSpaceWidth = width;
      });
    this.HsLayoutService.sidebarPosition
      .pipe(delay(0))
      .pipe(takeUntil(this.end))
      .subscribe((position) => {
        this.sidebarPosition = position;
        if (position === 'left') {
          this.HsLayoutService.contentWrapper.classList.add('flex-reverse');
          this.HsLayoutService.sidebarRight = false;
        }
      });
    this.HsLayoutService.sidebarVisible
      .pipe(takeUntil(this.end))
      .subscribe((visible) => {
        this.sidebarVisible = visible;
      });

    window.addEventListener(
      'resize',
      this.HsUtilsService.debounce(
        () => {
          this.HsLayoutService.updPanelSpaceWidth();
          this.HsLayoutService.updSidebarPosition();
        },
        50,
        false,
        this,
      ),
    );
  }

  ngAfterViewInit() {
    this.HsLayoutService.layoutElement = this.hslayout.nativeElement;
    const hsapp = this.elementRef.nativeElement.parentElement;

    if (window.innerWidth < this.HsConfig.mobileBreakpoint) {
      document.body.style.margin = '0px';
    }

    if (getComputedStyle(hsapp).display == 'inline') {
      hsapp.style.display = 'block';
      this.hsLog.warn(
        'Main element (<hslayers>) needs display property to be defined...fallback value added',
      );
    }
    //Minimal value expected for clientHeight of hsapp element at the initiation in case of WINDOWED mode
    //In comparison with clientHeight used to distinguish between full and windowed mode.
    const minHeight =
      window.devicePixelRatio <= 1 ? 350 : 300 * window.devicePixelRatio;
    //In case the app height is not set on hslayers element, height is determined by
    //the main panel height which vary from 0 if no mainpanel is set to 90 or even 208 in some cases .
    //Value of 300 or less /would mean that height is not set we need do something
    if (hsapp.clientHeight < minHeight) {
      const heightBefore = hsapp.clientHeight;
      hsapp.style.height = '100%';
      //If its still the same, height is not set on parents nor on hslayers element - we want fullscreen app
      if (hsapp.clientHeight == heightBefore) {
        hsapp.style.height = '100svh';
        this.hsLog.warn(
          `Main element (<hslayers>) needs height property to be defined...fallback value added`,
        );
      } else if (hsapp.clientHeight < heightBefore) {
        /*
         * If the value was set, but is lower than recommended - use the value but write a warning.
         */
        hsapp.style.height = heightBefore;
        this.hsLog.warn(
          `Height of the element <hslayers> is lower than recommended value of ${minHeight}px.`,
        );
      }
    }
  }

  /**
   * Toggles 'expanded' class on panelspace-wrapper. Switching height between 40 to 70vh
   */
  resizePanelSpaceWrapper(e: MouseEvent): void {
    const target: HTMLSpanElement = e.target as HTMLSpanElement;
    target.classList.toggle('icon-chevron-down');

    const contentWrapper = this.HsLayoutService.contentWrapper;
    const panelSpaceWrapper = contentWrapper.querySelector(
      '.hs-panelspace-wrapper',
    );
    if (panelSpaceWrapper) {
      panelSpaceWrapper.classList.toggle('expanded');
    }
    setTimeout(() => {
      this.HsEventBusService.updateMapSize.next();
    }, 500);
  }
}
