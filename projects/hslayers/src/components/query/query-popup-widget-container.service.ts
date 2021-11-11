import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs';

import {HsClearLayerComponent} from './widgets/clear-layer.component';
import {HsConfig} from '../../config.service';
import {HsDynamicTextComponent} from './widgets/dynamic-text.component';
import {HsFeatureInfoComponent} from './widgets/feature-info.component';
import {HsLayerNameComponent} from './widgets/layer-name.component';
import {HsPanelContainerService} from '../layout/panels/panel-container.service';
import {HsPanelItem} from '../layout/panels/panel-item';
import {WidgetItem} from './widgets/widget-item.type';

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
    this.initWidgets(this.hsConfig.queryPopupWidgets);
  }

  initWidgets(
    widgetNames: string[],
    panelObserver?: ReplaySubject<HsPanelItem>
  ) {
    if (widgetNames?.length > 0) {
      for (const widgetName of widgetNames) {
        let widgetFound = this.queryPopupWidgets.find(
          (widget) => widget.name == widgetName
        );

        if (!widgetFound && this.hsConfig.customQueryPopupWidgets?.length > 0) {
          widgetFound = this.hsConfig.customQueryPopupWidgets.find(
            (widget) => widget.name == widgetName
          );
        }
        this.create(widgetFound.component, undefined, panelObserver);
      }
    }
  }
}
