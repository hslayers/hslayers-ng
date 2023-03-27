import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import {
  Cartographic,
  Entity,
  Math,
  SceneMode,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Viewer,
  defined,
} from 'cesium';
import {HsConfig, HsMapService, HsUtilsService} from 'hslayers-ng';

import {HsCesiumQueryPopupService} from './query-popup.service';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumPickerService {
  viewer: Viewer;
  cesiumPositionClicked: Subject<any> = new Subject();
  constructor(
    private HsCesiumQueryPopupService: HsCesiumQueryPopupService,
    private HsMapService: HsMapService,
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService
  ) {}

  init(viewer: Viewer) {
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

    handler.setInputAction((movement) => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (pickedObject && pickedObject.id && pickedObject.id.onmouseup) {
        pickedObject.id.onmouseup(pickedObject.id);
        return;
      }
    }, ScreenSpaceEventType.LEFT_UP);

    handler.setInputAction(
      (movement) => this.handleScreenInteraction(movement, 'left'),
      ScreenSpaceEventType.LEFT_DOWN || ScreenSpaceEventType.RIGHT_DOWN
    );
    handler.setInputAction(
      (movement) => this.handleScreenInteraction(movement, 'right'),
      ScreenSpaceEventType.RIGHT_DOWN
    );
    handler.setInputAction(
      (movement) => this.handleScreenInteraction(movement, 'left'),
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
    handler.setInputAction((movement) => {
      if (this.hsConfig.popUpDisplay === 'hover') {
        this.hsUtilsService.debounce(
          this.handleScreenInteraction,
          200,
          false,
          this
        )({position: movement.endPosition}, 'none');
      }
    }, ScreenSpaceEventType.MOUSE_MOVE);
  }
  /**
   * @param movement -
   */
  handleScreenInteraction(movement, button: 'left' | 'right' | 'none') {
    const pickRay = this.viewer.camera.getPickRay(movement.position);
    const pickedObject = this.viewer.scene.pick(movement.position);

    if (this.viewer.scene.pickPositionSupported) {
      if (this.viewer.scene.mode === SceneMode.SCENE3D) {
        const cartesian = this.viewer.scene.pickPosition(movement.position);
        if (defined(cartesian)) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const longitudeString = Math.toDegrees(cartographic.longitude);
          const latitudeString = Math.toDegrees(cartographic.latitude);
          //TODO rewrite to subject
          if (button == 'left' || 'right') {
            this.cesiumPositionClicked.next([longitudeString, latitudeString]);
          }
        }
      }
    }
    if (pickedObject?.id && this.hsConfig.popUpDisplay !== 'none') {
      if (button == 'right' && pickedObject?.id?.onRightClick) {
        pickedObject.id.onRightClick(pickedObject.id);
      }
      if (button == 'left' && pickedObject?.id?.onclick) {
        pickedObject.id.onclick(pickedObject.id);
      }
      this.HsCesiumQueryPopupService.fillFeatures([
        this.HsMapService.getFeatureById(
          (pickedObject.id as Entity).properties.HsCesiumFeatureId.getValue()
        ),
      ]);
      this.HsCesiumQueryPopupService.showPopup({pixel: movement.position});
      return;
    } else {
      this.HsCesiumQueryPopupService.fillFeatures([]);
    }
  }
}
