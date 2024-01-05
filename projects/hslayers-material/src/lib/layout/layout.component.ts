import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

import {HsConfig, HsEventBusService, HsLayoutService} from 'hslayers-ng';
import {HsMapHostDirective} from './map-host.directive';

@Component({
  selector: 'hs-mat-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HsMatLayoutComponent implements AfterViewInit, OnInit {
  @ViewChild('hslayout') hslayout: ElementRef;
  @ViewChild(HsMapHostDirective, {static: true})
  mapHost: HsMapHostDirective;

  panelSpaceWidth: number;
  panelVisible(which, scope?): boolean {
    return this.HsLayoutService.panelVisible(which, scope);
  }

  panelEnabled(which, status?): boolean {
    return this.HsLayoutService.panelEnabled(which, status);
  }

  constructor(
    public HsConfig: HsConfig,
    public HsLayoutService: HsLayoutService,
    public HsEventBusService: HsEventBusService,
    // public HsThemeService: HsThemeService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef, // private HsUtilsService: HsUtilsService
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
    //if (window.innerWidth < 600 && this.HsUtilsService.runningInBrowser()) {
    //  const viewport = document.querySelector('meta[name="viewport"]');
    //  viewport.setAttribute(
    //    'content',
    //    'width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no'
    //  );
    //}
    ////this.$emit('scope_loaded', 'Layout');

    //switch (this.hsConfig.theme) {
    //  case 'dark':
    //    this.HsThemeService.setDarkTheme();
    //    break;

    //  default:
    //    this.HsThemeService.setLightTheme();
    //    break;
    //}
    this.HsLayoutService.panelSpaceWidth.subscribe((width) => {
      this.panelSpaceWidth = width;
    });
  }

  ngAfterViewInit() {
    this.HsLayoutService.layoutElement = this.hslayout.nativeElement;
    const hsapp = this.elementRef.nativeElement.parentElement;

    //if (window.innerWidth < 767) {
    //  document.body.style.margin = '0px';
    //}

    //if (getComputedStyle(hsapp).display == 'inline') {
    //  hsapp.style.display = 'block';
    //  console.warn(
    //    'Main element (#hs-app) needs display property to be defined...fallback value added'
    //  );
    //}
    ////Minimal value expected for clientHeight of hsapp element at the initiation in case of WINDOWED mode
    ////In comparison with clientHeight used to distinguish between full and windowed mode.
    //const minHeight =
    //  window.devicePixelRatio <= 1 ? 300 : 250 * window.devicePixelRatio;
    ////In case the app height is not set on hslayers element in this moment height is determined by
    ////the main panel height which vary from 0 if no mainpanel is set to 90 or even 208 in some cases .
    ////Value of 300 or less /would mean that height is not set we need do something
    //if (hsapp.clientHeight < minHeight) {
    //  hsapp.style.height = '100%';
    //  //If its still the same, height is not even set on parents of hslayers element - we want fullscreen app
    //  if (hsapp.clientHeight < minHeight) {
    //    hsapp.style.height = '100svh';
    //  }
    //  console.warn(
    //    'Main element (#hs-app) needs height property to be defined...fallback value added'
    //  );
    //}
    this.HsLayoutService.layoutLoads.next({
      element: this.elementRef.nativeElement,
      innerElement: '.hs-map-space',
    });
    this.HsLayoutService.mapSpaceRef.next(this.mapHost.viewContainerRef);
    //this.cdr.detectChanges();
  }
}
