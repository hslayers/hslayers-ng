import {BehaviorSubject} from 'rxjs';

export class HsLayoutServiceMock {
  apps: {
    [key: string]: {panel_statuses: any; panel_enabled: any; mainpanel: string};
  } = {default: {panel_statuses: {}, panel_enabled: {}, mainpanel: ''}};
  contentWrapper = document.createElement('div');
  sidebarPosition = new BehaviorSubject({app: 'default', position: 'left'});

  constructor() {}

  componentEnabled() {
    return true;
  }

  setMainPanel() {
    return true;
  }

  panelEnabled(which: string, app: string, status?: boolean): boolean {
    const appRef = this.get(app);
    if (status === undefined) {
      if (appRef.panel_enabled[which] != undefined) {
        return appRef.panel_enabled[which];
      } else {
        return true;
      }
    } else {
      appRef.panel_enabled[which] = status;
    }
  }

  get(app: string) {
    return this.apps[app ?? 'default'];
  }

  panelVisible(which, app: string, scope?) {
    const appRef = this.get(app);
    if (scope) {
      if (scope.panelName == undefined) {
        scope.panelName = which;
      }
    }
    if (appRef.panel_statuses[which] !== undefined) {
      return appRef.panel_statuses[which] && this.panelEnabled(which, app);
    }
    return appRef.mainpanel == which || (scope && scope.unpinned);
  }
}
