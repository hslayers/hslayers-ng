import {Injectable} from '@angular/core';

import {HsConfig} from '../../config.service';
import {HsPanelContainerService} from './panels/panel-container.service';
import {HsToolbarPanelContainerService} from '../toolbar/toolbar-panel-container.service';

@Injectable({
  providedIn: 'root',
})
export class HsOverlayPanelContainerService extends HsPanelContainerService {
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
        i = await import('../toolbar/toolbar.component');
        break;
      case 'measureToolbar':
        i = await import('../measure/measure-toolbar.component');
        break;
      case 'searchToolbar':
        i = await import('../search/search-toolbar.component');
        break;
      case 'drawToolbar':
        i = await import('../draw/draw-toolbar/draw-toolbar.component');
        break;
      case 'layerManagerGallery':
        // eslint-disable-next-line prettier/prettier
        i = await import('../layer-manager/gallery/layer-manager-gallery.component');
        break;
      case 'info':
        i = await import('../info/info.component');
        break;
      case 'geolocation':
        i = await import('../geolocation/geolocation.component');
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
