import {Component, Input, OnInit, Type} from '@angular/core';

import {
  HsConfig,
  HsPanelContainerService,
} from 'hslayers-ng';

import {HsMatLayerManagerComponent} from './layermanager/layermanager.component';

@Component({
  selector: 'hslayers-material',
  template: `
    <hs-mat-layout
      #hslayout
      [app]="id"
      style="height: 100%; max-height: 100vh; position: relative; width: 100%; display: block"
      class="hs-mat-layout"
      layout="column"
    ></hs-mat-layout>
  `,
  styles: [],
})
export class HslayersMaterialComponent implements OnInit {
  @Input() config: HsConfig;
  @Input() id: string;
  // @Input() app = 'default';
  constructor(
    public hsConfig: HsConfig,
    private hsPanelContainerService: HsPanelContainerService,
  ) {}

  /**
   * Check if panel is configured to be visible in hsConfig.get(app).panelsEnabled
   * or hsLayoutService.panelsEnabledDefaults and create one if so.
   * @param name - Name of panel used in panelsEnabled config
   * @param panelComponent - Class defining panel
   * @param data - Extra misc data object to be stored in panel
   */
  createPanel(
    name: string,
    panelComponent: Type<any>,
    app: string,
    data?: any
  ): void {
    if (
      this.hsConfig.apps[this.id] == undefined ||
      this.hsConfig.apps[this.id].panelsEnabled[name]
    ) {
      this.hsPanelContainerService.create(panelComponent, data || {}, app);
    }
  }

  ngOnInit(): void {
    if (this.config) {
      this.hsConfig.update(this.config, this.id);
    }

    if (this.id == undefined) this.id = 'default';

    this.createPanel('layermanager', HsMatLayerManagerComponent, this.id, {});
  }
}
