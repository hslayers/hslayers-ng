import {HsQueryPopupService} from 'hslayers-ng/common/query-popup';
import {Injectable} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsOverlayContainerService} from 'hslayers-ng/shared/panels';
import {HsPanelContainerService} from 'hslayers-ng/shared/panels';
import {HsToolbarPanelContainerService} from 'hslayers-ng/shared/panels';

@Injectable({
  providedIn: 'root',
})
export class HsOverlayConstructorService extends HsPanelContainerService {
  constructor(
    private hsConfig: HsConfig,
    private hsToolbarPanelContainerService: HsToolbarPanelContainerService,
    private HsOverlayContainerService: HsOverlayContainerService,
    private hsQueryPopupService: HsQueryPopupService,
  ) {
    super();
  }

  /**
   * Create GUI component based on name string.
   */
  private async _createGuiComponent(
    name: string,
    service: HsPanelContainerService = this.HsOverlayContainerService,
  ) {
    const cName = `Hs${this.capitalizeFirstLetter(name)}Component`;
    const data =
      name == 'queryPopup' ? {service: this.hsQueryPopupService} : {};
    let i;
    switch (name) {
      case 'queryPopup':
        i = await import('hslayers-ng/common/query-popup');
        break;
      case 'toolbar':
        i = await import('hslayers-ng/components/toolbar');
        break;
      case 'measureToolbar':
        i = await import('hslayers-ng/components/measure');
        break;
      case 'searchToolbar':
        i = await import('hslayers-ng/components/search');
        break;
      case 'drawToolbar':
        i = await import('hslayers-ng/components/draw');
        break;
      case 'layerManagerGallery':
        i = await import('hslayers-ng/components/layer-manager');
        break;
      case 'info':
        i = await import('hslayers-ng/components/info');
        break;
      case 'geolocation':
        i = await import('hslayers-ng/components/geolocation');
        break;
      default:
        console.warn(`Trying to create unidentified GUI component ${name}`);
        break;
    }
    service.create(i[cName], data);
  }

  /**
   * Wrapper function which creates GUI overlay components based on value
   * provided in config.componentsEnabled
   */
  createGuiOverlay() {
    if (this.hsConfig.componentsEnabled.guiOverlay) {
      /**
       * TOOLBAR
       */
      if (this.hsConfig.componentsEnabled.toolbar) {
        this._createGuiComponent('toolbar');
        const enabledToolbarParts = Object.entries(
          this.hsConfig.componentsEnabled,
        ).reduce(
          (acc, [component, isEnabled]) =>
            isEnabled && component.includes('Toolbar')
              ? [...acc, component]
              : acc,
          [],
        );
        for (const toolbar of enabledToolbarParts) {
          this._createGuiComponent(
            toolbar,
            this.hsToolbarPanelContainerService,
          );
        }
      }
      /**
       * GUI OVERLAY
       */
      if (this.hsConfig.componentsEnabled.queryPopup) {
        this._createGuiComponent('queryPopup');
      }
      if (this.hsConfig.componentsEnabled.basemapGallery) {
        this._createGuiComponent('layerManagerGallery');
      }
      if (this.hsConfig.componentsEnabled.info) {
        this._createGuiComponent('info');
      }
      if (this.hsConfig.componentsEnabled.geolocationButton) {
        this._createGuiComponent('geolocation');
      }
    }
  }

  /**
   * NOTE: Duplicity but compiler keeps complaining about circular dependency
   */
  private capitalizeFirstLetter(target: string): string {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
}
