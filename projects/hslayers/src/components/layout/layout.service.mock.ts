export class HsLayoutServiceMock {
  apps: {
    [key: string]: {panel_statuses: any; panel_enabled: any; mainpanel: string};
  } = {default: {panel_statuses: {}, panel_enabled: {}, mainpanel: ''}};
  contentWrapper = document.createElement('div');
  constructor() {}

  componentEnabled() {
    return true;
  }

  setMainPanel() {
    return true;
  }

  panelEnabled(which: string, app: string, status?: boolean): boolean {
    if (status === undefined) {
      if (this.get(app).panel_enabled[which] != undefined) {
        return this.get(app).panel_enabled[which];
      } else {
        return true;
      }
    } else {
      this.get(app).panel_enabled[which] = status;
    }
  }

  get(app: string) {
    return this.apps[app ?? 'default'];
  }

  panelVisible(which, app: string, scope?) {
    if (scope) {
      if (scope.panelName == undefined) {
        scope.panelName = which;
      }
    }
    if (this.get(app).panel_statuses[which] !== undefined) {
      return (
        this.get(app).panel_statuses[which] && this.panelEnabled(which, app)
      );
    }
    return this.get(app).mainpanel == which || (scope && scope.unpinned);
  }

  sidebarBottom() {
    return window.innerWidth <= 767;
  }
}
