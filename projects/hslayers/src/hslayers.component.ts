import {Component, Input, OnInit, Type, ViewChild} from '@angular/core';

import {HsAddDataComponent} from './components/add-data/add-data.component';
import {HsCompositionsComponent} from './components/compositions/compositions.component';
import {HsConfig} from './config.service';
import {HsDrawComponent} from './components/draw/draw.component';
import {HsFeatureTableComponent} from './components/feature-table/feature-table.component';
import {HsLanguageComponent} from './components/language/language.component';
import {HsLayerManagerComponent} from './components/layermanager/layermanager.component';
import {HsLayerManagerService} from './components/layermanager/layermanager.service';
import {HsLayoutComponent} from './components/layout/layout.component';
import {HsLayoutService} from './components/layout/layout.service';
import {HsLegendComponent} from './components/legend/legend.component';
import {HsMeasureComponent} from './components/measure/measure.component';
import {HsPanelContainerService} from './components/layout/panels/panel-container.service';
import {HsPrintComponent} from './components/print/print.component';
import {HsQueryComponent} from './components/query/query.component';
import {HsSaveMapComponent} from './components/save-map/save-map.component';
import {HsSearchComponent} from './components/search/search.component';
import {HsShareComponent} from './components/permalink/share.component';
import {HsStylerComponent} from './components/styles/styler.component';
import {HsTripPlannerComponent} from './components/trip-planner/trip-planner.component';
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'hslayers',
  templateUrl: './hslayers.html',
  styles: [],
})
export class HslayersComponent implements OnInit {
  @Input() config: HsConfig;
  @ViewChild(HsLayoutComponent) layout: HsLayoutComponent;
  constructor(
    public hsConfig: HsConfig,
    private hsPanelContainerService: HsPanelContainerService,
    private hsLayoutService: HsLayoutService,
    private HsLayerManagerService: HsLayerManagerService
  ) {}
  createPanel(name: string, panelComponent: Type<any>, data?: any): void {
    const panelsEnabled = this.hsConfig.panelsEnabled;
    if (
      panelsEnabled[name] ||
      (panelsEnabled[name] == undefined &&
        this.hsLayoutService.panelsEnabledDefaults[name])
    ) {
      this.hsPanelContainerService.create(panelComponent, data || {});
    }
  }
  ngOnInit(): void {
    if (this.config) {
      this.hsConfig.update(this.config);
    }
    this.createPanel('tripPlanner', HsTripPlannerComponent);
    this.createPanel('addData', HsAddDataComponent);
    this.createPanel('draw', HsDrawComponent);
    this.createPanel('search', HsSearchComponent);
    this.createPanel('feature_table', HsFeatureTableComponent);
    this.createPanel('saveMap', HsSaveMapComponent);
    this.createPanel('language', HsLanguageComponent);
    this.createPanel('info', HsQueryComponent);
    this.createPanel('permalink', HsShareComponent);
    this.createPanel('print', HsPrintComponent);
    this.createPanel('measure', HsMeasureComponent);
    this.createPanel('composition_browser', HsCompositionsComponent);
    this.createPanel('legend', HsLegendComponent);
    this.createPanel(
      'layermanager',
      HsLayerManagerComponent,
      this.HsLayerManagerService.data
    );
    this.hsPanelContainerService.create(HsStylerComponent, {});
  }
}
