import {HsConfig} from 'hslayers-ng/config';
import {Injectable, Type} from '@angular/core';

import {HsButton} from 'hslayers-ng/types';
import {HsPanelContainerService} from 'hslayers-ng/shared/panels';
import {HsSidebarService} from 'hslayers-ng/shared/sidebar';
import {HsUtilsService} from 'hslayers-ng/shared/utils';
import {skip} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsPanelConstructorService {
  constructor(
    private hsConfig: HsConfig,
    private HsPanelContainerService: HsPanelContainerService,
    private hsUtilsService: HsUtilsService,
    private hsSidebarService: HsSidebarService,
  ) {
    this.hsConfig.configChanges.pipe(skip(1)).subscribe(async () => {
      /**
       * Create panels activated after app init. Buttons are handled in sidebarService
       */
      const activePanels = Object.entries(this.hsConfig.panelsEnabled).reduce(
        (acc, [panel, isEnabled]) => (isEnabled ? [...acc, panel] : acc),
        [],
      );
      const created = this.HsPanelContainerService.panels.map((p) => p.name);
      const toBeCreated = activePanels.filter((p) => !created.includes(p));
      for (const panel of toBeCreated) {
        await this._createPanel(panel);
      }
    });
  }

  /**
   * Create HSLayers panel component based on name string
   */
  private async _createPanel(name: string, data?: any) {
    const cName = `Hs${this.hsUtilsService.capitalizeFirstLetter(
      name,
    )}Component`;
    let i;
    switch (name) {
      case 'layerManager':
        i = await import('hslayers-ng/components/layer-manager');
        break;
      case 'draw':
        i = await import('hslayers-ng/components/draw');
        break;
      case 'addData':
        i = await import('hslayers-ng/components/add-data');
        break;
      case 'compositions':
        i = await import('hslayers-ng/components/compositions');
        break;
      case 'featureTable':
        i = await import('hslayers-ng/components/feature-table');
        break;
      case 'language':
        i = await import('hslayers-ng/components/language');
        break;
      case 'legend':
        i = await import('hslayers-ng/components/legend');
        break;
      case 'mapSwipe':
        i = await import('hslayers-ng/components/map-swipe');
        break;
      case 'measure':
        i = await import('hslayers-ng/components/measure');
        break;
      case 'print':
        i = await import('hslayers-ng/components/print');
        break;
      case 'query':
        i = await import('hslayers-ng/components/query');
        break;
      case 'saveMap':
        i = await import('hslayers-ng/components/save-map');
        break;
      case 'search':
        i = await import('hslayers-ng/components/search');
        break;
      case 'styler':
        i = await import('hslayers-ng/components/styler');
        break;
      case 'share':
        i = await import('hslayers-ng/components/share');
        break;
      case 'tripPlanner':
        i = await import('hslayers-ng/components/trip-planner');
        break;

      default:
        break;
    }
    this.HsPanelContainerService.create(i[cName], data || {});
  }

  /**
   * INTERNAL. You most likely want to use 'createPanelandButton' to create additional panel
   * @param name - Name of panel used in panelsEnabled config
   * @param data - Extra misc data object to be stored in panel
   * @param buttonDefinition - HS Button definition object
   */
  async _createPanelAndButton(
    name: string,
    data?: any,
    buttonDefinition?: HsButton,
  ): Promise<void> {
    this._createPanel(name, data);
    /**Create styler component automatically in case LM is present */
    if (name == 'layerManager') {
      this._createPanel('styler', data);
    }
    this.hsSidebarService.addButton(
      this.hsSidebarService.buttonDefinition[name] || buttonDefinition,
    );
  }

  /**
   * Creates additional panel and sidebar button
   * @param name - Name of panel used in panelsEnabled config
   * @param buttonDefinition - HS Button definition object
   * @param data - Extra misc data object to be stored in panel
   */
  createPanelAndButton(
    component: Type<any>,
    buttonDefinition: HsButton,
    data?: any,
  ) {
    this.HsPanelContainerService.create(component, data || {});
    this.hsSidebarService.addButton(buttonDefinition);
  }

  /**
   * Wrapper function which creates panels and corresponding sidebar buttons
   * for panels which are set to be active in config.panelsEnabled
   */
  createActivePanels() {
    const activePanels = Object.entries(this.hsConfig.panelsEnabled).reduce(
      (acc, [panel, isEnabled]) => (isEnabled ? [...acc, panel] : acc),
      [],
    );
    for (const panel of activePanels) {
      if (
        this.hsSidebarService.buttonDefinition[panel] &&
        this.hsConfig.panelsEnabled[panel]
      ) {
        this._createPanelAndButton(panel, {});
      }
    }
  }
}
