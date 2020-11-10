import {Component, ElementRef} from '@angular/core';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayoutService} from './layout.service';

@Component({
  selector: 'hs-layout',
  template: require('./partials/layout.html'),
})
export class HsLayoutComponent {
  panelVisible = (which, scope) =>
    this.HsLayoutService.panelVisible(which, scope);
  panelEnabled = (which, status) =>
    this.HsLayoutService.panelEnabled(which, status);
  panelSpaceWidth = () => this.HsLayoutService.panelSpaceWidth();

  constructor(
    private HsConfig: HsConfig,
    private HsLayoutService: HsLayoutService,
    private HsEventBusService: HsEventBusService,
    private elementRef: ElementRef
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
    if (HsConfig.sidebarPosition === 'left') {
      this.HsLayoutService.contentWrapper.classList.add('flex-reverse');
      this.HsLayoutService.sidebarRight = false;
    } else if (HsConfig.sidebarPosition != 'invisible') {
      HsConfig.sidebarPosition = 'right';
    }

    if (this.HsConfig.importCss == undefined || this.HsConfig.importCss) {
      require(/* webpackChunkName: "lazy-bootstrap" */ 'bootstrap/dist/css/bootstrap.isolated.css');

      require('ol/ol.css');
      require('../../css/app.css');
      /* if (window.cordova) {
        require('../../css/mobile.css');
      } */
      require('../../css/whhg-font/css/whhg.css');

      if (this.HsConfig.theme) {
        if (this.HsConfig.theme.sidebar) {
          this.HsLayoutService.layoutElement.style.setProperty(
            '--sidebar-bg-color',
            this.HsConfig.theme.sidebar.background || null
          );
        }
        this.HsLayoutService.layoutElement.style.setProperty(
          '--sidebar-item-color',
          this.HsConfig.theme.sidebar.itemColor || null
        );
        this.HsLayoutService.layoutElement.style.setProperty(
          '--sidebar-active-color',
          this.HsConfig.theme.sidebar.activeItemColor || null
        );
      }
    }
  }

  ngOnInit(): void {
    this.HsLayoutService.contentWrapper = this.elementRef.nativeElement.querySelector(
      '.hs-content-wrapper'
    );
    if (window.innerWidth < 600) {
      const viewport = document.querySelector('meta[name="viewport"]');
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=0.6, maximum-scale=2, user-scalable=no'
      );
    }
    //this.$emit('scope_loaded', 'Layout');
  }
}
