import {BehaviorSubject, Subject} from 'rxjs';
import {HsConfigMock} from './config.service.mock';
import {inject} from '@angular/core';

export class HsLayoutServiceMock {
  panel_statuses = {};
  panel_enabled = {};
  mainpanel$ = new BehaviorSubject('');
  get mainpanel() {
    return this.mainpanel$.getValue();
  }
  contentWrapper = document.createElement('div');
  sidebarPosition$ = new BehaviorSubject('left');
  layoutLoads = new Subject();
  /**
   * Using HsConfig imported into layoutService in HsPanelBaseComponent
   * for convenience of not having to pass it into super everywhere thus
   * it needs to be that way it tests as well
   */
  _puremapApp = new BehaviorSubject(false);

  // Add missing hsConfig property
  hsConfig = {
    panelWidths: {
      default: 425,
    },
    configChanges: new Subject(),
    mobileBreakpoint: 767,
    sidebarClosed: false,
    panelsEnabled: {
      legend: true,
      measure: true,
      query: true,
      compositions: true,
      draw: true,
      layerManager: true,
      featureTable: true,
      print: true,
      saveMap: true,
      language: true,
      share: true,
      sensors: true,
      search: true,
      tripPlanner: true,
      addData: true,
      mapSwipe: true,
      wfsFilter: true,
    },
    assetsPath: '/assets',
    id: 'testapp',
  };

  constructor() {}

  componentEnabled() {
    return true;
  }

  setMainPanel() {
    return true;
  }

  panelEnabled(which: string, status?: boolean): boolean {
    if (status === undefined) {
      if (this.panel_enabled[which] != undefined) {
        return this.panel_enabled[which];
      }
      return true;
    }
    this.panel_enabled[which] = status;
  }

  panelVisible(which, scope?) {
    if (scope) {
      if (scope.panelName == undefined) {
        scope.panelName = which;
      }
    }
    if (this.panel_statuses[which] !== undefined) {
      return this.panel_statuses[which] && this.panelEnabled(which);
    }
    let tmp = false;
    tmp = this.mainpanel == which || scope?.unpinned;
    return tmp;
  }
}
