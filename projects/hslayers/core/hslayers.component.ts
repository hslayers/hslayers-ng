import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  NgZone,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import {debounceTime, delay, filter, fromEvent, map} from 'rxjs';
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

interface PanState {
  readonly MIN_HEIGHT: number;
  readonly MAX_HEIGHT: number;
  initialHeight: number;
  startY: number;
  isProcessing: boolean;
}

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

  private panState: PanState = {
    /**
     * Maximum and minimum values of how much the panel can 'moved' by panning
     * Final values are controlled by css variables
     */
    MIN_HEIGHT: 20, // vh
    MAX_HEIGHT: 70, // vh
    initialHeight: 0,
    startY: 0,
    isProcessing: false,
  };

  private panelSpace: HTMLElement;
  private mapSpace: HTMLElement;

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
    private ngZone: NgZone,
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

  async ngAfterViewInit() {
    this.HsLayoutService.layoutElement = this.hslayout.nativeElement;
    const hsapp = this.elementRef.nativeElement;
    hsapp.style.overflow = 'hidden';

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

    this.mapSpace = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-map-space',
    ) as HTMLElement;

    this.panelSpace = this.HsLayoutService.contentWrapper.querySelector(
      '.hs-panelspace',
    ) as HTMLElement;

    const canHover = window.matchMedia('(hover: hover)').matches;
    if (!canHover) {
      const {default: Hammer} = await import('hammerjs');

      this.ngZone.runOutsideAngular(() => {
        const isProcessingPan = this.panState.isProcessing;

        const panRecognizer = new Hammer(
          this.HsLayoutService.layoutElement.querySelector(
            '.hs-panelspace-expander',
          ),
          {
            'recognizers': [
              [Hammer.Pan, {direction: Hammer.DIRECTION_VERTICAL}],
            ],
            cssProps: {
              touchCallout: 'none',
              contentZooming: 'none',
              tapHighlightColor: 'rgba(0,0,0,0)',
            },
          },
        );

        // Handle pan start
        fromEvent(panRecognizer, 'panstart')
          .pipe(
            filter(() => !isProcessingPan),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe((e: any) => {
            this.panState.initialHeight =
              this.panelSpace.getBoundingClientRect().height;
            this.panState.startY = e.center.y;

            // Fix map height
            const currentMapHeight =
              this.mapSpace.getBoundingClientRect().height;
            this.mapSpace.style.flex = `0 0 ${currentMapHeight}px`;
            this.panelSpace.classList.add('dragging');
          });

        // Handle pan move
        fromEvent(panRecognizer, 'panmove')
          .pipe(
            filter(() => !isProcessingPan),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe((e: any) => this.updatePanelHeight(e));

        // Handle pan end
        fromEvent(panRecognizer, 'panend')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => this.snapToNearestHeight());
      });
    }
  }

  /**
   * Updates the height of the panel space based on the pan event.
   *
   * @param e The pan event object.
   */
  private updatePanelHeight(e: any): void {
    // Calculate the delta Y from the start of the pan to the current position.
    const deltaY = e.center.y - this.panState.startY;
    const viewportHeight = window.innerHeight;
    // Calculate the new height of the panel space in viewport height units (vh).
    const newHeightVh =
      ((this.panState.initialHeight - deltaY) / viewportHeight) * 100;
    // Clamp the new height to be within the minimum and maximum allowed heights.
    const clampedHeight = Math.max(
      this.panState.MIN_HEIGHT,
      Math.min(this.panState.MAX_HEIGHT, newHeightVh),
    );

    // Set the style height of the panel space to the clamped height.
    this.panelSpace.style.height = `${clampedHeight}vh`;
  }

  /**
   * Snaps the panel space to the nearest height.
   */
  private snapToNearestHeight(): void {
    this.panState.isProcessing = true;

    const panelspace = this.panelSpace;
    const currentHeight =
      (panelspace.getBoundingClientRect().height / window.innerHeight) * 100;
    const shouldCollapse =
      currentHeight <=
      (this.panState.MIN_HEIGHT + this.panState.MAX_HEIGHT) / 2;

    panelspace.classList.remove('dragging');
    /**
     * Remove user agent styles to allow css take over
     */
    panelspace.style.removeProperty('height');
    this.mapSpace.style.removeProperty('flex');

    /**
     * Add or remove panel-collapsed class based on the current height
     * causing height to snap to the nearest value
     */
    if (shouldCollapse) {
      panelspace.classList.add('panel-collapsed');
    } else {
      panelspace.classList.remove('panel-collapsed');
    }

    // Update map only after snap animation completes
    setTimeout(() => {
      this.ngZone.run(() => {
        this.HsEventBusService.mapSizeUpdates.next();
      });
      this.panState.isProcessing = false;
    }, 300);
  }
}
