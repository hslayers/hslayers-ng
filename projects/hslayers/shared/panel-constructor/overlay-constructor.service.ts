import {Injectable} from '@angular/core';

import {HsConfig} from 'hslayers-ng/config';
import {HsPanelContainerService} from 'hslayers-ng/shared/panels';
import {HsToolbarPanelContainerService} from 'hslayers-ng/shared/panels';

@Injectable({
  providedIn: 'root',
})
export class HsOverlayConstructorService extends HsPanelContainerService {
  constructor(
    private hsConfig: HsConfig,
    private hsToolbarPanelContainerService: HsToolbarPanelContainerService,
  ) {
    super();
  }

  /**
   * Create GUI component based on name string.
   */
  private async _createGuiComponent(
    name: string,
    service: HsPanelContainerService = this,
  ) {
    const cName = `Hs${this.capitalizeFirstLetter(name)}Component`;
    let i;
    switch (name) {
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
    service.create(i[cName], {});
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
