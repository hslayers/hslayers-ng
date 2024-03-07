import {Injectable} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsDrawService, TMP_LAYER_TITLE} from 'hslayers-ng/shared/draw';
import {HsLanguageService} from 'hslayers-ng/shared/language';
import {HsLaymanService} from 'hslayers-ng/shared/save-map';
import {HsMapService} from 'hslayers-ng/shared/map';
import {
  HsRmLayerDialogComponent,
  HsRmLayerDialogResponse,
  HsRmLayerDialogeDeleteOptions,
} from './remove-layer-dialog.component';
import {HsToastService} from 'hslayers-ng/common/toast';
import {getDefinition, getTitle} from 'hslayers-ng/common/extensions';

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
    private hsDrawService: HsDrawService,
    private hsLaymanService: HsLaymanService,
    private hsDialogContainerService: HsDialogContainerService,
  ) {}

  /**
   * Create a remove layer wrapper
   */
  wrapLayer(layer: Layer<Source>): RemoveLayerWrapper {
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
    layer?: Layer<Source>,
    deleteFromOptions?: HsRmLayerDialogeDeleteOptions[],
  ): Promise<void> {
    const dialog = this.hsDialogContainerService.create(
      HsRmLayerDialogComponent,
      {
        multiple: false,
        message: 'DRAW.reallyDeleteThisLayer',
        note: this.getDeleteNote(),
        title: 'COMMON.confirmDelete',
        items: layer
          ? [this.wrapLayer(layer)]
          : [this.wrapLayer(this.hsDrawService.selectedLayer)],
        deleteFromOptions,
      },
    );
    const confirmed: HsRmLayerDialogResponse = await dialog.waitResult();
    if (confirmed.value == 'yes') {
      await this.completeLayerRemoval(
        layer ?? this.hsDrawService.selectedLayer,
        confirmed.type,
      );
      this.hsDrawService.selectedLayer = null;
      this.hsDrawService.fillDrawableLayers();
    }
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
    layers: Layer<Source>[] | string[],
    deleteFromOptions: HsRmLayerDialogeDeleteOptions[],
  ): Promise<boolean> {
    const layersToRemove = layers ?? this.hsDrawService.drawableLayers ?? [];
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
      //}
      for (const l of drawablesToRemove) {
        await this.completeLayerRemoval(l.layer, confirmed.type);
      }
      this.hsToastService.removeByText(
        this.hsLanguageService.getTranslation(
          'LAYMAN.deletionInProgress',
          undefined,
        ),
      );
      this.hsDrawService.selectedLayer = null;
      this.hsDrawService.fillDrawableLayers();
    }
    return confirmed.value == 'yes';
  }

  /**
   * Remove layer from map and layman if desirable and possible
   */
  private async completeLayerRemoval(
    layerToRemove: Layer<Source> | string,
    deleteFrom: HsRmLayerDialogeDeleteOptions,
  ): Promise<void> {
    if (deleteFrom !== 'map') {
      await this.removeFromCatalogue(layerToRemove);
    }
    if (deleteFrom.includes('map')) {
      this.hsMapService.getMap().removeLayer(layerToRemove as Layer<Source>);
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
    const title = isLayer ? getTitle(layerToRemove) : layerToRemove;
    if (title == TMP_LAYER_TITLE) {
      this.hsDrawService.tmpDrawLayer = false;
    }
  }

  /**
   * Syntactic sugar for translating
   */
  translate(key: string, params?: any): string {
    return this.hsLanguageService.getTranslation(key, params);
  }

  getDeleteNote(plural?: boolean): string {
    return this.hsDrawService.isAuthenticated
      ? plural
        ? 'DRAW.deleteNotePlural'
        : 'DRAW.deleteNote'
      : '';
  }
}
