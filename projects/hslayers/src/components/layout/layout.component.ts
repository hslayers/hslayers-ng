import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from './layout.service';
import {HsMapHostDirective} from './map-host.directive';
import {HsOverlayPanelContainerService} from './overlay-panel-container.service';
import {HsPanelContainerService} from './panels/panel-container.service';
import {HsUtilsService} from '../utils/utils.service';

@Component({
  selector: 'hs-layout',
  templateUrl: './partials/layout.html',
})
export class HsLayoutComponent implements AfterViewInit {
  @ViewChild('hslayout') hslayout: ElementRef;
  @ViewChild(HsMapHostDirective, {static: true})
  mapHost: HsMapHostDirective;

  panelVisible(which, scope?): boolean {
    return this.HsLayoutService.panelVisible(which, scope);
  }

  panelEnabled(which, status?): boolean {
    return this.HsLayoutService.panelEnabled(which, status);
  }
  panelSpaceWidth() {
    return this.HsLayoutService.panelSpaceWidth();
  }

  constructor(
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private HsUtilsService: HsUtilsService,
    public HsPanelContainerService: HsPanelContainerService,
    public HsOverlayPanelContainerService: HsOverlayPanelContainerService
  ) {
    this.HsLayoutService.layoutElement = elementRef.nativeElement;
  }

  ngOnInit(): void {
    this.HsLayoutService.contentWrapper =
      this.elementRef.nativeElement.querySelector('.hs-content-wrapper');
    if (this.HsConfig.sidebarPosition === 'left') {
      this.HsLayoutService.contentWrapper.classList.add('flex-reverse');
      this.HsLayoutService.sidebarRight = false;
    } else if (this.HsConfig.sidebarPosition != 'invisible') {
      this.HsConfig.sidebarPosition = 'right';
    }
    if (window.innerWidth < 600 && this.HsUtilsService.runningInBrowser()) {
      const viewport = document.querySelector('meta[name="viewport"]');
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no'
      );
    }
    //this.$emit('scope_loaded', 'Layout');
  }

  ngAfterViewInit() {
    this.HsLayoutService.layoutElement = this.hslayout.nativeElement;
    const hsapp = this.elementRef.nativeElement.parentElement;

    if (window.innerWidth < 767) {
      document.body.style.margin = '0px';
    }

    if (getComputedStyle(hsapp).display == 'inline') {
      hsapp.style.display = 'block';
      console.warn(
        'Main element (<hslayers>) needs display property to be defined...fallback value added'
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
      hsapp.style.height = '100%';
      //If its still the same, height is not even set on parents of hslayers element - we want fullscreen app
      if (hsapp.clientHeight < minHeight) {
        hsapp.style.height = 'calc(var(--vh, 1vh) * 100)';
      }
      console.warn(
        'Main element (<hslayers>) needs height property to be defined...fallback value added'
      );
    }
    this.HsEventBusService.layoutLoads.next({
      element: this.elementRef.nativeElement,
      innerElement: '.hs-map-space',
    });
    this.HsLayoutService.mapSpaceRef.next(this.mapHost.viewContainerRef);
    this.cdr.detectChanges();
  }
}
