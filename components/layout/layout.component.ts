import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from './layout.service';
import {HsMapHostDirective} from './map-host.directive';

@Component({
  selector: 'hs-layout',
  template: require('./partials/layout.html'),
})
export class HsLayoutComponent {
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
    private cdr: ChangeDetectorRef
  ) {
    this.HsLayoutService.layoutElement = elementRef.nativeElement;
    setTimeout(() => {
      const hsapp = elementRef.nativeElement.parentElement;
      if (getComputedStyle(hsapp).display == 'inline') {
        hsapp.style.display = 'block';
        console.warn(
          'Main element (#hs-app) needs display property to be defined...fallback value added'
        );
      }
      if (hsapp.style.height == 0) {
        hsapp.style.height = 'calc(var(--vh, 1vh) * 100)';
        console.warn(
          'Main element (#hs-app) needs height property to be defined...fallback value added'
        );
      }
    }, 250);
    this.HsEventBusService.layoutLoads.next({
      element: elementRef.nativeElement,
      innerElement: '.hs-map-container',
    });

    require('../../css/app.scss');
  }

  ngOnInit(): void {
    this.HsLayoutService.contentWrapper = this.elementRef.nativeElement.querySelector(
      '.hs-content-wrapper'
    );
    if (this.HsConfig.sidebarPosition === 'left') {
      this.HsLayoutService.contentWrapper.classList.add('flex-reverse');
      this.HsLayoutService.sidebarRight = false;
    } else if (this.HsConfig.sidebarPosition != 'invisible') {
      this.HsConfig.sidebarPosition = 'right';
    }
    if (window.innerWidth < 600) {
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
    this.HsLayoutService.mapSpaceRef.next(this.mapHost.viewContainerRef);
    this.cdr.detectChanges();
  }
}
