import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsMapService} from 'hslayers-ng/shared/map';
import {
  HsRmLayerDialogComponent,
  HsRmLayerDialogResponse,
  HsRmLayerDialogeDeleteOptions,
} from './remove-layer-dialog.component';
import {HsToastService} from 'hslayers-ng/common/toast';
import {getDefinition, getName} from 'hslayers-ng/common/extensions';

export type RemoveLayerWrapper = {
  layer: Layer<Source> | string;
  toRemove: boolean;
  displayTitle: string;
};

@Injectable({
  providedIn: 'root',
})
export class HsRemoveLayerDialogService {
  constructor(
    private hsMapService: HsMapService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsLaymanService: HsLaymanService,
    private hsCommonLaymanService: HsCommonLaymanService,
    private hsDialogContainerService: HsDialogContainerService,
  ) {}

  /**
   * Create a remove layer wrapper
   */
  wrapLayer(layer: Layer<Source> | string): RemoveLayerWrapper {
    return {
      layer,
      toRemove: false,
      displayTitle: undefined,
    };
  }

  /**
   * Removes selected drawing layer from both Layermanager and Layman
   * @param layer Layer to be deleted - use when trying to delete layer other than hsDrawService.selectedLayer
   * @param deleteFromOptions From where the layer should be deleted defaults to map, map&catalogue
   */
  async removeLayer(
    layer: Layer<Source> | string,
    deleteFromOptions?: HsRmLayerDialogeDeleteOptions[],
  ): Promise<boolean> {
    const dialog = this.hsDialogContainerService.create(
      HsRmLayerDialogComponent,
      {
        multiple: false,
        message: 'DRAW.reallyDeleteThisLayer',
        note: this.getDeleteNote(),
        title: 'COMMON.confirmDelete',
        items: [this.wrapLayer(layer)],
        deleteFromOptions,
      },
    );
    const confirmed: HsRmLayerDialogResponse = await dialog.waitResult();
    if (confirmed.value == 'yes') {
      const mapLayers = confirmed.type.includes('catalogue')
        ? this.hsMapService.getLayersArray()
        : undefined;
      await this.completeLayerRemoval(layer, confirmed.type, mapLayers);
    }
    return confirmed.value == 'yes';
  }

  /**
   * Overload for when delete options is 'catalogue'
   * ['catalogue'] delete option is expected
   */
  async removeMultipleLayers(
    layers: string[],
    deleteFromOptions: ['catalogue'],
  ): Promise<boolean>;

  // Overload for other delete options with Layer<Source>[] type
  async removeMultipleLayers(
    layers: Layer<Source>[],
    deleteFromOptions:
      | Exclude<HsRmLayerDialogeDeleteOptions, 'catalogue'>[]
      | ['map'],
  ): Promise<boolean>;

  /**
   * Removes multiple selected layers from both Layermanager and Layman
   * @param layer Layers to be deleted - use when trying to remove other than drawableLayers
   * @param deleteFromOptions From where the layer should be deleted defaults to map, map&catalogue
   */
  async removeMultipleLayers(
    layersToRemove: Layer<Source>[] | string[],
    deleteFromOptions?: HsRmLayerDialogeDeleteOptions[],
  ): Promise<boolean> {
    const items = layersToRemove.map((l) => this.wrapLayer(l));

    const dialog = this.hsDialogContainerService.create(
      HsRmLayerDialogComponent,
      {
        multiple: true,
        message: 'DRAW.pleaseCheckTheLayers',
        note: this.getDeleteNote(true),
        title: 'COMMON.selectAndConfirmToDeleteMultiple',
        items: items,
        deleteFromOptions,
      },
    );
    const confirmed: HsRmLayerDialogResponse = await dialog.waitResult();
    if (confirmed.value == 'yes') {
      this.hsToastService.createToastPopupMessage(
        'LAYMAN.deleteLayersRequest',
        'LAYMAN.deletionInProgress',
        {
          toastStyleClasses: 'bg-info text-white',
          serviceCalledFrom: 'HsDrawService',
          customDelay: 600000,
        },
      );

      const drawablesToRemove = items.filter((l) => l.toRemove);
      /**
       * Remove checked layers, may be either - from layman and/or map
       */
      const mapLayers = confirmed.type.includes('catalogue')
        ? this.hsMapService.getLayersArray()
        : undefined;
      for (const l of drawablesToRemove) {
        await this.completeLayerRemoval(l.layer, confirmed.type, mapLayers);
      }
      this.hsToastService.removeByText(
        this.hsLanguageService.getTranslation(
          'LAYMAN.deletionInProgress',
          undefined,
        ),
      );
    }
    return confirmed.value == 'yes';
  }

  /**
   * Remove layer from map and layman if desirable and possible
   */
  private async completeLayerRemoval(
    layerToRemove: Layer<Source> | string,
    deleteFrom: HsRmLayerDialogeDeleteOptions,
    mapLayers?: Layer<Source>[],
  ): Promise<void> {
    if (deleteFrom !== 'map') {
      await this.removeFromCatalogue(layerToRemove);
    }
    if (deleteFrom.includes('map')) {
      this.hsMapService.getMap().removeLayer(layerToRemove as Layer<Source>);
    } else {
      this.tryRemovingFromMap(layerToRemove as string, mapLayers);
    }
  }

  /**
   * Once layer is removed from catalogue try to find it in the map by name and remove it as well
   */
  private tryRemovingFromMap(layer: string, layers: Layer<Source>[]): void {
    const lyr = layers.find((l) => getName(l) === layer);
    if (lyr) {
      this.hsMapService.getMap().removeLayer(lyr);
    }
  }

  private async removeFromCatalogue(layerToRemove: Layer<Source> | string) {
    const isLayer = layerToRemove instanceof Layer;
    if (isLayer) {
      const definition = getDefinition(layerToRemove);
      if (
        definition?.format?.toLowerCase().includes('wfs') &&
        definition?.url
      ) {
        await this.hsLaymanService.removeLayer(layerToRemove);
      }
    } else {
      //Remove layer which is not in map from catalogue based on name
      await this.hsLaymanService.removeLayer(layerToRemove);
    }
  }

  /**
   * Syntactic sugar for translating
   */
  translate(key: string, params?: any): string {
    return this.hsLanguageService.getTranslation(key, params);
  }

  getDeleteNote(plural?: boolean): string {
    return this.hsCommonLaymanService.isAuthenticated()
      ? plural
        ? 'DRAW.deleteNotePlural'
        : 'DRAW.deleteNote'
      : '';
  }
}
