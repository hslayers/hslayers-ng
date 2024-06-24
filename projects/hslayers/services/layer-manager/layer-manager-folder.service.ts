import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {HsConfig} from 'hslayers-ng/config';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerDescriptor, HsLayermanagerFolder} from 'hslayers-ng/types';
import {HsLayermanagerDataObject} from './layer-manager.service';
import {
  getPath,
  getShowInLayerManager,
  getTitle,
  setPath,
} from 'hslayers-ng/common/extensions';

enum FolderActionTypes {
  ADD_LAYER = 'ADD_LAYER',
  REMOVE_LAYER = 'REMOVE_LAYER',
  SORT_BY_Z = 'SORT_BY_Z',
}
// Action Interfaces
interface AddLayerAction {
  type: FolderActionTypes.ADD_LAYER;
  lyr: HsLayerDescriptor;
}

interface RemoveLayerAction {
  type: FolderActionTypes.REMOVE_LAYER;
  lyr: HsLayerDescriptor;
}

interface SortFoldersByZAction {
  type: FolderActionTypes.SORT_BY_Z;
  lyr: HsLayerDescriptor;
}

type FolderAction = AddLayerAction | RemoveLayerAction | SortFoldersByZAction;

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerFolderService {
  // Subject to dispatch actions to manipulate folders through
  folderAction$ = new Subject<FolderAction>();

  data: HsLayermanagerDataObject;
  constructor(
    private hsLanguageService: HsLanguageService,
    private hsConfig: HsConfig,
  ) {}

  foldersReducer(
    state: Map<string, HsLayermanagerFolder>,
    action: FolderAction,
  ): Map<string, HsLayermanagerFolder> {
    switch (action.type) {
      case FolderActionTypes.ADD_LAYER:
        return this.populateFolders(state, action.lyr);
      case FolderActionTypes.REMOVE_LAYER:
        return this.cleanFolders(state, action.lyr);
      case FolderActionTypes.SORT_BY_Z:
        return this.sortFoldersByZ(state);
      default:
        return state;
    }
  }

  // Action Creators
  addLayer(lyr: HsLayerDescriptor): AddLayerAction {
    return {
      type: FolderActionTypes.ADD_LAYER,
      lyr: lyr,
    };
  }

  removeLayer(lyr: HsLayerDescriptor): RemoveLayerAction {
    return {
      type: FolderActionTypes.REMOVE_LAYER,
      lyr: lyr,
    };
  }

  sortByZ(): SortFoldersByZAction {
    return {
      type: FolderActionTypes.SORT_BY_Z,
      lyr: undefined,
    };
  }

  /**
   * Place layer into layer manager folder structure based on path property hsl-path of layer
   * @param lyr - Layer to add into folder structure
   */
  private populateFolders(
    state: Map<string, HsLayermanagerFolder>,
    lyr: HsLayerDescriptor,
  ): Map<string, HsLayermanagerFolder> {
    const newState = new Map(state);
    const olLayer = lyr.layer;
    let path = getPath(olLayer);
    if (
      !path ||
      path == 'Other' ||
      this.hsLanguageService
        .getTranslation('LAYERMANAGER')
        ['other']?.toLowerCase() === path.toLowerCase()
    ) {
      path = 'other';
      setPath(olLayer, path);
    }
    const zIndex = olLayer.getZIndex();

    if (!newState.has(path)) {
      newState.set(path, {
        layers: [lyr],
        zIndex: zIndex,
        visible: true,
      });
      return newState;
    }
    const folder = newState.get(path);
    folder.layers.push(lyr);
    folder.zIndex = Math.max(folder.zIndex, zIndex);
    return newState;
  }

  /**
   * Remove layer from layer folder and clean empty folder
   * @param lyr - Layer to remove from layer folder
   */
  private cleanFolders(
    state: Map<string, HsLayermanagerFolder>,
    lyr: HsLayerDescriptor,
  ): Map<string, HsLayermanagerFolder> {
    try {
      const newState = new Map(state);
      const olLayer = lyr.layer;
      if (getShowInLayerManager(olLayer) == false) {
        return newState;
      }

      const path = getPath(olLayer);
      if (!path) {
        console.warn(
          `Unexpected. Layer $${getTitle(olLayer)} has no path defined`,
        );
        return newState;
      }

      const folder = newState.get(path);
      if (!folder) {
        console.warn(
          `Unexpected. Layer $${getTitle(olLayer)} belongs to path ${path} but it could not be found`,
        );
        return newState;
      }

      folder.layers.splice(folder.layers.indexOf(lyr), 1);
      if (folder.layers.length === 0) {
        newState.delete(path);
      }
      return newState;
    } catch (error) {
      console.error(
        getTitle(lyr.layer)
          ? `There was an error while cleaning folders after ${getTitle(lyr.layer)} was removed`
          : 'There was an attempt to clean folders without valid layer param provided',
        error,
      );
    }
  }

  /**
   * Sorts folders by z-index.
   */
  private sortFoldersByZ(
    state: Map<string, HsLayermanagerFolder>,
  ): Map<string, HsLayermanagerFolder> {
    return new Map(
      [...state.entries()].sort(
        (a, b) =>
          (a[1].zIndex < b[1].zIndex ? -1 : a[1].zIndex > b[1].zIndex ? 1 : 0) *
          (this.hsConfig.reverseLayerList ?? true ? -1 : 1),
      ),
    );
  }
}
