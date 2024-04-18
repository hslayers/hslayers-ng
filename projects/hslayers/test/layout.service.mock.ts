import {BehaviorSubject, Subject} from 'rxjs';
import {HsConfig} from 'hslayers-ng/config';

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
  constructor(public hsConfig: HsConfig) {}

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
      } else {
        return true;
      }
    } else {
      this.panel_enabled[which] = status;
    }
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
