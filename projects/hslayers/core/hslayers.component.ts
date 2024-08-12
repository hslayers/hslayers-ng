import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {delay} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

import {HsConfig, HsConfigObject} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsExternalService} from 'hslayers-ng/services/external';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapHostDirective} from './map-host.directive';
import {
  HsOverlayContainerService,
  HsPanelContainerService,
} from 'hslayers-ng/services/panels';
import {HsUtilsService} from 'hslayers-ng/services/utils';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'hslayers',
  templateUrl: './hslayers.html',
  styles: [],
})
export class HslayersComponent implements AfterViewInit, OnInit {
  @Input() config: HsConfigObject;
  @Input() id: string;
  @ViewChild('hslayout') hslayout: ElementRef;
  @ViewChild(HsMapHostDirective, {static: true})
  mapHost: HsMapHostDirective;

  sidebarPosition: string;
  sidebarVisible: boolean;
  private destroyRef = inject(DestroyRef);

  constructor(
    public hsConfig: HsConfig,
    private elementRef: ElementRef,
    public HsLayoutService: HsLayoutService,
    private HsUtilsService: HsUtilsService,
    private hsLog: HsLogService,
    public HsEventBusService: HsEventBusService,
    public HsPanelContainerService: HsPanelContainerService,
    public HsOverlayContainerService: HsOverlayContainerService,
    private hsExternalService: HsExternalService, //Leave this, need to inject somewhere
  ) {}

  async ngOnInit(): Promise<void> {
    if (this.config) {
      this.hsConfig.update(this.config);
    }
    if (this.id) {
      this.hsConfig.setAppId(this.id);
    }

    this.HsLayoutService.layoutElement =
      this.elementRef.nativeElement.querySelector('.hs-layout');

    this.HsLayoutService.contentWrapper =
      this.elementRef.nativeElement.querySelector('.hs-content-wrapper');

    if (window.innerWidth < 600 && this.HsUtilsService.runningInBrowser()) {
      const viewport = document.querySelector('meta[name="viewport"]');
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no',
      );
    }

    // const appInUrl = this.hsShareUrlService.getParamValue('app');
    // if (appInUrl != undefined) {
    //   this.HsLayoutService.scrollTo(this.elementRef);
    // }

    this.HsLayoutService.layoutLoads.next({
      element: this.elementRef.nativeElement,
      innerElement: '.hs-map-space',
    });
    this.HsLayoutService.mapSpaceRef.next(this.mapHost.viewContainerRef);

    this.HsLayoutService.sidebarPosition
      .pipe(delay(0), takeUntilDestroyed(this.destroyRef))
      .subscribe((position) => {
        this.sidebarPosition = position;
        if (position === 'left') {
          this.HsLayoutService.contentWrapper.classList.add('flex-reverse');
          this.HsLayoutService.sidebarRight = false;
        }
      });
    this.HsLayoutService.sidebarVisible
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    const hsapp = this.elementRef.nativeElement;

    if (window.innerWidth < this.hsConfig.mobileBreakpoint) {
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
      this.HsEventBusService.mapSizeUpdates.next();
    }, 500);
  }
}
