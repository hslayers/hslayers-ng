import {Injectable} from '@angular/core';

import {Group, Layer, Vector as VectorLayer} from 'ol/layer';
import {Source} from 'ol/source';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerDescriptor, HsTerrainLayerDescriptor} from 'hslayers-ng/types';
import {HsLayermanagerDataObject} from './layer-manager.service';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {
  getActive,
  getBase,
  getExclusive,
  getPath,
  setActive,
} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerVisibilityService {
  /**
   * Store if baselayers are visible (more precisely one of baselayers)
   * @public
   */
  baselayersVisible = true;
  currentResolution: number;
  data: HsLayermanagerDataObject;
  constructor(
    private hsMapService: HsMapService,
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService,
    private hsEventBusService: HsEventBusService,
  ) {}

  layerVisibilityChanged(e): void {
    if (getBase(e.target) != true) {
      for (const layer of this.data.layers) {
        if (layer.layer == e.target) {
          layer.visible = e.target.getVisible();
          break;
        }
      }
    } else {
      for (const baseLayer of this.data.baselayers) {
        if (baseLayer.layer == e.target) {
          baseLayer.active = e.target.getVisible();
        } else {
          baseLayer.active = false;
        }
      }
    }
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param lyr - Selected layer
   */
  isLayerInResolutionInterval(lyr: Layer<Source>): boolean {
    const cur_res = this.hsMapService.getMap().getView().getResolution();
    this.currentResolution = cur_res;
    return (
      lyr.getMinResolution() <= cur_res && cur_res <= lyr.getMaxResolution()
    );
  }

  /**
   * Change visibility of selected layer. If layer has exclusive setting, other layers from same group may be turned invisible
   * @param visibility - Visibility layer should have
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeLayerVisibility(visibility: boolean, layer: HsLayerDescriptor): void {
    layer.layer.setVisible(visibility);
    layer.visible = visibility;
    layer.grayed = !this.isLayerInResolutionInterval(layer.layer);
    //Set the other exclusive layers invisible - all or the ones with same path based on config
    if (visibility && getExclusive(layer.layer) == true) {
      for (const other_layer of this.data.layers) {
        const pathExclusivity = this.hsConfig.pathExclusivity
          ? getPath(other_layer.layer) == getPath(layer.layer)
          : true;
        if (
          getExclusive(other_layer.layer) == true &&
          other_layer != layer &&
          pathExclusivity
        ) {
          other_layer.layer.setVisible(false);
          other_layer.visible = false;
        }
      }
    }
    if (!visibility && this.hsUtilsService.instOf(layer.layer, VectorLayer)) {
      this.hsEventBusService.LayerManagerLayerVisibilityChanges.next(layer);
    }
  }

  /**
   * Show all layers of particular layer group (when groups are defined)
   * @param theme - Group layer to activate
   */
  activateTheme(theme: Group): void {
    const switchOn = getActive(theme) ? false : true;
    setActive(theme, switchOn);
    let baseSwitched = false;
    theme.setVisible(switchOn);
    for (const layer of theme.get('layers')) {
      if (getBase(layer) == true && !baseSwitched) {
        this.changeBaseLayerVisibility(null, null);
        baseSwitched = true;
      } else if (getBase(layer) == true) {
        return;
      } else {
        layer.setVisible(switchOn);
      }
    }
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeTerrainLayerVisibility($event, layer: HsTerrainLayerDescriptor): void {
    for (const terrainLayer of this.data.terrainLayers) {
      if (terrainLayer.type == 'terrain') {
        terrainLayer.visible = terrainLayer == layer;
        terrainLayer.active = terrainLayer.visible;
      }
    }
    this.hsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }

  /**
   * Change visibility (on/off) of baselayers, only one baselayer may be visible
   * @param $event - Info about the event change visibility event, used if visibility of only one layer is changed
   * @param layer - Selected layer - wrapped layer object (layer.layer expected)
   */
  changeBaseLayerVisibility($event = null, layer = null): void {
    if (layer === null || layer.layer != undefined) {
      if (this.baselayersVisible == true) {
        //*NOTE Currently breaking base layer visibility when loading from composition with custom base layer to
        //other compositions without any base layer
        //*TODO Rewrite this loop hell to more readable code
        if ($event) {
          //&& this.data.baselayer != layer.title
          for (const baseLayer of this.data.baselayers) {
            const isToggledLayer = baseLayer == layer;
            if (baseLayer.layer) {
              //Don't trigger change:visible event when isToggledLayer = false
              baseLayer.layer.set('visible', isToggledLayer, !isToggledLayer);
              baseLayer.visible = isToggledLayer;
              baseLayer.active = isToggledLayer;
              if (!isToggledLayer) {
                baseLayer.galleryMiniMenu = false;
              }
            }
          }
        } else {
          this.baselayersVisible = false;
          for (const baseLayer of this.data.baselayers) {
            baseLayer.layer.setVisible(false);
            baseLayer.galleryMiniMenu = false;
          }
        }
      } else {
        if ($event) {
          layer.active = true;
          for (const baseLayer of this.data.baselayers) {
            const isToggledLayer = baseLayer == layer;
            if (isToggledLayer) {
              baseLayer.layer.setVisible(true);
            }
            baseLayer.active = isToggledLayer;
            baseLayer.visible = isToggledLayer;
          }
        } else {
          for (const baseLayer of this.data.baselayers) {
            if (baseLayer.visible == true) {
              baseLayer.layer.setVisible(true);
            }
          }
        }
        this.baselayersVisible = true;
      }
    } else {
      for (const baseLayer of this.data.baselayers) {
        if (baseLayer.type != undefined && baseLayer.type == 'terrain') {
          baseLayer.visible = baseLayer == layer;
          baseLayer.active = baseLayer.visible;
        }
      }
    }
    this.hsEventBusService.LayerManagerBaseLayerVisibilityChanges.next(layer);
  }
}
