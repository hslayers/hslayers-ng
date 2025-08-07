import {
  Injectable,
  Injector,
  inject,
  runInInjectionContext,
} from '@angular/core';
import {filter, firstValueFrom, map, take} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';

import {HsConfig} from 'hslayers-ng/config';
import {
  HsOverlayContainerService,
  HsPanelContainerService,
  HsToolbarPanelContainerService,
} from 'hslayers-ng/services/panels';
import {HsQueryPopupService} from 'hslayers-ng/common/query-popup';

@Injectable({
  providedIn: 'root',
})
export class HsOverlayConstructorService extends HsPanelContainerService {
  private hsConfig = inject(HsConfig);
  private hsToolbarPanelContainerService = inject(
    HsToolbarPanelContainerService,
  );
  private hsOverlayContainerService = inject(HsOverlayContainerService);
  private hsQueryPopupService = inject(HsQueryPopupService);

  private injector = inject(Injector);

  panels$ = toObservable(this.hsToolbarPanelContainerService.panels);

  /**
   * Create GUI component based on name string.
   */
  private async _createGuiComponent(
    name: string,
    service: HsPanelContainerService = this.hsOverlayContainerService,
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

        //Imitate toolbar queue
        runInInjectionContext(this.injector, async () => {
          for (const [index, toolbar] of enabledToolbarParts.entries()) {
            /**
             * Wait for previous toolbar to be created before creating the next one
             * First one is created immediately
             */
            if (index > 0) {
              await firstValueFrom(
                this.panels$.pipe(
                  map((panels) => panels.map((p) => p.name)),
                  filter((panels) =>
                    panels.includes(enabledToolbarParts[index - 1]),
                  ),
                  take(1),
                ),
              );
            }

            this._createGuiComponent(
              toolbar,
              this.hsToolbarPanelContainerService,
            );
          }
        });
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
