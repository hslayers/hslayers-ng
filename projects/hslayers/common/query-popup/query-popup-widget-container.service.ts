import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs';

import {HsClearLayerComponent} from './widgets/clear-layer.component';
import {HsConfig} from 'hslayers-ng/config';
import {HsDynamicTextComponent} from './widgets/dynamic-text.component';
import {HsFeatureInfoComponent} from './widgets/feature-info.component';
import {HsLayerNameComponent} from './widgets/layer-name.component';
import {HsPanelContainerService} from 'hslayers-ng/services/panels';
import {HsPanelItem} from 'hslayers-ng/common/panels';
import {WidgetItem} from 'hslayers-ng/types';

@Injectable({
  providedIn: 'root',
})
export class HsQueryPopupWidgetContainerService extends HsPanelContainerService {
  queryPopupWidgets: WidgetItem[] = [
    {name: 'layer-name', component: HsLayerNameComponent},
    {name: 'feature-info', component: HsFeatureInfoComponent},
    {name: 'clear-layer', component: HsClearLayerComponent},
    {name: 'dynamic-text', component: HsDynamicTextComponent},
  ];

  constructor(private hsConfig: HsConfig) {
    super();
  }

  cleanup() {
    console.warn('TODO: HsQueryPopupWidgetContainerService cleanup');
  }

  /**
   * Initialize query popup widgets
   * @param widgetNames - Array of widget names
   * @param panelObserver - (Optional)
   */
  initWidgets(
    widgetNames: string[],
    panelObserver?: ReplaySubject<HsPanelItem>,
  ): void {
    if (widgetNames?.length > 0) {
      for (const widgetName of widgetNames) {
        let widgetFound = this.queryPopupWidgets.find(
          (widget) => widget.name == widgetName,
        );

        if (!widgetFound && this.hsConfig.customQueryPopupWidgets?.length > 0) {
          widgetFound = this.hsConfig.customQueryPopupWidgets.find(
            (widget) => widget.name == widgetName,
          );
        }
        this.create(widgetFound.component, undefined, panelObserver);
      }
    }
  }
}
