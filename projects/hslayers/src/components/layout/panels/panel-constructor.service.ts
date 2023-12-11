import {HsConfig} from '../../../config.service';
import {Injectable, Type} from '@angular/core';

import {HsButton} from '../../sidebar/button.interface';
import {HsPanelContainerService} from './panel-container.service';
import {HsSidebarService} from '../../sidebar/sidebar.service';
import {HsUtilsService} from '../../utils/utils.service';
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
    const kebabName = this.hsUtilsService.camelToKebab(name);
    const i = await import(`../../${kebabName}/${kebabName}.component`);
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
