import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  Input,
  NgZone,
  OnInit,
  Signal,
  ViewChild,
  inject,
} from '@angular/core';
import {delay, filter, fromEvent, timer} from 'rxjs';
import {takeUntilDestroyed, toSignal} from '@angular/core/rxjs-interop';

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
import {safeTakeUntilDestroyed} from './safeTakeUntilDestroyed';

interface PanState {
  readonly MIN_HEIGHT: number;
  readonly MAX_HEIGHT: number;
  isProcessing: boolean;
  TOGGLE_THRESHOLD: number;
}

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'hslayers',
  templateUrl: './hslayers.html',
  styles: [],
  standalone: false,
})
export class HslayersComponent implements AfterViewInit, OnInit {
  @Input() config: HsConfigObject;
  @Input() id: string;
  @ViewChild('hslayout') hslayout: ElementRef;
  @ViewChild(HsMapHostDirective, {static: true})
  mapHost: HsMapHostDirective;

  sidebarPosition: Signal<string>;
  sidebarVisible: Signal<boolean>;

  private destroyRef = inject(DestroyRef);

  private panState: PanState = {
    /**
     * Maximum and minimum values in 'vh' units of how much the panel can be 'moved' by panning
     * Final values are controlled by css variables
     */
    MIN_HEIGHT: 20, // vh
    MAX_HEIGHT: 70, // vh
    isProcessing: false,
    /**
     * Threshold in px
     */
    TOGGLE_THRESHOLD: 200,
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
  ) {
    this.sidebarPosition = toSignal(this.HsLayoutService.sidebarPosition);
    this.sidebarVisible = toSignal(this.HsLayoutService.sidebarVisible);
  }

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
        if (position === 'left') {
          this.HsLayoutService.contentWrapper.classList.add('flex-reverse');
          this.HsLayoutService.sidebarRight = false;
        }
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
            filter(() => !this.panState.isProcessing),
            safeTakeUntilDestroyed(this.destroyRef),
          )
          .subscribe((e: any) => {
            // Dynamically set the map space height to freeze it in its current height
            // because of performance reasons
            const currentMapHeight =
              this.mapSpace.getBoundingClientRect().height;
            this.mapSpace.style.flex = `0 0 ${currentMapHeight}px`;
            this.panelSpace.classList.add('dragging');
          });

        // Handle pan move
        fromEvent(panRecognizer, 'panmove')
          .pipe(
            filter(() => !this.panState.isProcessing),
            safeTakeUntilDestroyed(this.destroyRef),
          )
          .subscribe((e: any) => this.updatePanelHeight(e));

        // Handle pan end
        fromEvent(panRecognizer, 'panend')
          .pipe(safeTakeUntilDestroyed(this.destroyRef))
          .subscribe((e: any) => this.snapToNearestHeight(e));
      });
    }
  }

  /**
   * Updates the height of the panel space based on the pan event.
   *
   * @param e The pan event object.
   */
  private updatePanelHeight(e: any): void {
    const viewportHeight = window.innerHeight;
    // Calculate the new height of the panel space in viewport height units (vh).
    // Clamp the new height to be within the minimum and maximum allowed heights.
    const newHeightVh = Math.max(
      this.panState.MIN_HEIGHT,
      Math.min(
        this.panState.MAX_HEIGHT,
        ((window.innerHeight - e.center.y) / viewportHeight) * 100,
      ),
    );

    // Set the style height of the panel space to the clamped height.
    this.panelSpace.style.height = `${newHeightVh}vh`;
  }

  /**
   * Snaps the panel space to the nearest height.
   */
  /**
   * Snaps the panel space to the nearest height based on the pan event.
   *
   * @param e The pan event object.
   */
  private snapToNearestHeight(e: any): void {
    const panelspace = this.panelSpace;

    /**
     * Remove the dragging class and inline style height from the panel space
     * to visually indicate the end of dragging and allow it to snap to its nearest height.
     */
    panelspace.classList.remove('dragging');
    panelspace.style.removeProperty('height');
    this.mapSpace.style.removeProperty('flex');

    // Check if the absolute delta Y of the pan event exceeds the toggle threshold.
    if (Math.abs(e.deltaY) >= this.panState.TOGGLE_THRESHOLD) {
      panelspace.classList.toggle('panel-collapsed');
    }

    // Set a timeout to allow for visual adjustments before notifying about map size updates.
    timer(300)
      .pipe(safeTakeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.ngZone.run(() => {
          this.HsEventBusService.mapSizeUpdates.next();
          this.panState.isProcessing = false;
        });
      });
  }
}
