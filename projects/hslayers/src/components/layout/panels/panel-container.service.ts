import {Injectable, Type} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';

import {HsPanelComponent} from './panel-component.interface';
import {HsPanelContainerServiceInterface} from './panel-container.service.interface';
import {HsPanelItem} from './panel-item';
import {KeyNumberDict} from '../../../config.service';

@Injectable({
  providedIn: 'root',
})
export class HsPanelContainerService
  implements HsPanelContainerServiceInterface
{
  panels: HsPanelComponent[] = [];
  panelObserver: ReplaySubject<HsPanelItem> = new ReplaySubject();
  panelDestroyObserver: Subject<any> = new Subject();

  constructor() {}
  /**
   * Create new dynamic panels. They are replayed in the PanelContainerComponent
   * in case of race conditions existing where panels are created before the
   * container component is even added to the DOM.
   * @param component - PanelComponent class
   * @param data-  Extra data to give the new panel
   * @param panelObserver - ReplaySubject to which you need to add the panel components. This is used when panels in this service are used only sometimes (for particular layers)
   */
  create(
    component: Type<any>,
    data: any,
    panelObserver?: ReplaySubject<HsPanelItem>
  ): void {
    if (data === undefined) {
      data = {};
    }
    (panelObserver ?? this.panelObserver).next(
      new HsPanelItem(component, data)
    );
  }

  destroy(component: HsPanelComponent): void {
    if (component.cleanup) {
      component.cleanup();
    }
    const panelCollection = this.panels;
    const panelIx = panelCollection.findIndex((d) => d == component);
    if (panelIx > -1) {
      panelCollection.splice(panelIx, 1);
    }
    this.panelDestroyObserver.next(component);
  }

  /**
   * An admittedly hacky solution to set panel width
   * from dictionary containing names (as in name property in PanelComponent)
   * and numbers stored in HsConfig.panelWidths in most cases.
   * It's also possible to set the css class hs-panel-width-(400-850) on the panel
   * templates root element skipping the HsConfig.panelWidths.
   * @param panelWidths - key-value pairs of panel names and their widths
   * @param componentRefInstance - Panel component instance which can be read from HsPanelContainerService.panels array
   */
  setPanelWidth(
    panelWidths: KeyNumberDict,
    componentRefInstance: HsPanelComponent
  ): void {
    if (componentRefInstance === undefined) {
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
