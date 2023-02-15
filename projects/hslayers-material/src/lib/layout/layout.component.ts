import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

import {Subject, delay, takeUntil} from 'rxjs';

import {HsConfig, HsEventBusService, HsLayoutService, HsUtilsService, HsPanelContainerService} from 'hslayers-ng';
import {HsMapHostDirective} from './map-host.directive';

@Component({
  selector: 'hs-mat-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class HsMatLayoutComponent implements AfterViewInit, OnInit, OnDestroy {
  @Input() app = 'default';
  @ViewChild('hslayout') hslayout: ElementRef;
  @ViewChild(HsMapHostDirective, {static: true})
  mapHost: HsMapHostDirective;
  panelSpaceWidth: number;
  sidebarPosition: string;
  sidebarVisible: boolean;
  private end = new Subject<void>();
  panelVisible(which, scope?): boolean {
    return this.hsLayoutService.panelVisible(which, scope);
  }

  panelEnabled(which, status?): boolean {
    return this.hsLayoutService.panelEnabled(which, status);
  }

  constructor(
    public hsConfig: HsConfig,
    public hsLayoutService: HsLayoutService,
    public hsEventBusService: HsEventBusService,
    // public hsThemeService: HsThemeService,
    private elementRef: ElementRef,
    private hsUtilsService: HsUtilsService,
    public hsPanelContainerService: HsPanelContainerService
  ) {}

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.hsLayoutService.get(this.app).layoutElement = this.elementRef.nativeElement;
    this.hsLayoutService.get(this.app).contentWrapper =
      this.elementRef.nativeElement.querySelector('.hs-content-wrapper');
    this.hsLayoutService.init(this.app);
    if (this.hsConfig.get(this.app).sidebarPosition === 'left') {
      this.hsLayoutService.get(this.app).contentWrapper.classList.add(
        'flex-reverse'
      );
      this.hsLayoutService.get(this.app).sidebarRight = false;
    } else if (this.hsConfig.get(this.app).sidebarPosition != 'invisible') {
      this.hsConfig.get(this.app).sidebarPosition = 'right';
    }
    //if (window.innerWidth < 600 && this.hsUtilsService.runningInBrowser()) {
    //  const viewport = document.querySelector('meta[name="viewport"]');
    //  viewport.setAttribute(
    //    'content',
    //    'width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no'
    //  );
    //}
    ////this.$emit('scope_loaded', 'Layout');

    //switch (this.hsConfig.get(app).theme) {
    //  case 'dark':
    //    this.hsThemeService.setDarkTheme();
    //    break;

    //  default:
    //    this.hsThemeService.setLightTheme();
    //    break;
    //}
    this.hsLayoutService.panelSpaceWidth
      .pipe(takeUntil(this.end))
      .subscribe(({app, width}) => {
        if (this.app == app) {
          this.panelSpaceWidth = width;
        }
      });
    this.hsLayoutService.sidebarPosition
      .pipe(delay(0))
      .pipe(takeUntil(this.end))
      .subscribe(({app, position}) => {
        if (this.app == app) {
          this.sidebarPosition = position;
        }
      });
    this.hsLayoutService.sidebarVisible
      .pipe(takeUntil(this.end))
      .subscribe(({app, visible}) => {
        if (this.app == app) {
          this.sidebarVisible = visible;
        }
      });

    window.addEventListener(
      'resize',
      this.hsUtilsService.debounce(
        () => {
          this.hsLayoutService.updPanelSpaceWidth(this.app);
          this.hsLayoutService.updSidebarPosition(this.app);
        },
        50,
        false,
        this
      )
    );
  }

  ngAfterViewInit() {
    this.hsLayoutService.get(this.app).layoutElement =
      this.hslayout.nativeElement;
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
    //    hsapp.style.height = 'calc(var(--vh, 1vh) * 100)';
    //  }
    //  console.warn(
    //    'Main element (#hs-app) needs height property to be defined...fallback value added'
    //  );
    //}
    this.hsEventBusService.layoutLoads.next({
      element: this.elementRef.nativeElement,
      innerElement: '.hs-map-space',
      app: this.app,
    });
    this.hsLayoutService.mapSpaceRef.next({
      viewContainerRef: this.mapHost.viewContainerRef,
      app: this.app,
    });
    //this.cdr.detectChanges();
  }
}
