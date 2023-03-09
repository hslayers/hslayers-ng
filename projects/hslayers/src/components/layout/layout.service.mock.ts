import {BehaviorSubject} from 'rxjs';

export class HsLayoutServiceMock {
  panel_statuses: {};
  panel_enabled: {};
  mainpanel: '';
  contentWrapper = document.createElement('div');
  sidebarPosition$ = new BehaviorSubject('left');

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
