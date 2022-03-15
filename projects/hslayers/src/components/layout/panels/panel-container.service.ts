import {Injectable, Type} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';

import {HsPanelComponent} from './panel-component.interface';
import {
  HsPanelContainerParams,
  HsPanelContainerServiceInterface,
} from './panel-container.service.interface';
import {HsPanelItem} from './panel-item';
import {KeyNumberDict} from '../../../config.service';

@Injectable({
  providedIn: 'root',
})
export class HsPanelContainerService
  implements HsPanelContainerServiceInterface
{
  apps: any = {default: new HsPanelContainerParams()};
  constructor() {}

  get(app: string): HsPanelContainerParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new HsPanelContainerParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * Create new dynamic panels. They are replayed in the PanelContainerComponent
   * in case of race conditions existing where panels are created before the
   * container component is even added to the dom.
   * @param component PanelComponent class
   * @param data Extra data to give the new panel
   * @param app App id
   * @param panelObserver ReplaySubject to which you need to add the panel components. This is used when panels in this service are used only sometimes (for particular layers)
   */
  create(
    component: Type<any>,
    data: any,
    app: string,
    panelObserver?: ReplaySubject<HsPanelItem>
  ): void {
    if (data?.app == undefined) {
      data.app = app;
    }
    (panelObserver ?? this.get(app).panelObserver).next(
      new HsPanelItem(component, data)
    );
  }

  destroy(component: HsPanelComponent, app: string): void {
    this.get(app).panelDestroyObserver.next(component);
  }

  /**
   * An admittedly hacky solution to set panel width
   * from dictionary containing names (as in name property in PanelComponent)
   * and numbers stored in HsConfig.get(app).panelWidths in most cases.
   * It's also possible to set the css class hs-panel-width-(400-850) on the panel
   * templates root element skipping the HsConfig.get(app).panelWidths.
   * @param panelWidths - key-value pairs of panel names and their widths
   * @param componentRefInstance - Panel component instance which can be read from HsPanelContainerService.panels array
   */
  setPanelWidth(
    panelWidths: KeyNumberDict,
    componentRefInstance: HsPanelComponent
  ): void {
    if (componentRefInstance == undefined) {
      return;
    }
    const pnlWidth =
      panelWidths[componentRefInstance.name] || panelWidths.default;
    const guessedClass = `hs-panel-width-${Math.round(pnlWidth / 25) * 25}`;
    setTimeout(() => {
      const rootView = componentRefInstance.viewRef as any; //Any is used because the actual class RootViewRef is not exported from angular
      //Without timeout componentRefInstance.viewRef.rootNodes could contain only placeholder <!--container--> until the real content is loaded
      for (const rootNode of rootView.rootNodes) {
        for (const child of rootNode.children) {
          if (!child.classList.contains(guessedClass)) {
            child.classList.add(guessedClass);
          }
        }
      }
    }, 0);
  }
}
