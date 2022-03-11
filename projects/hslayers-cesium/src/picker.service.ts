import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

import Cartographic from 'cesium/Source/Core/Cartographic';
import Entity from 'cesium/Source/DataSources/Entity';
import Math from 'cesium/Source/Core/Math';
import SceneMode from 'cesium/Source/Scene/SceneMode';
import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import defined from 'cesium/Source/Core/defined';
import {HsConfig, HsMapService, HsUtilsService} from 'hslayers-ng';

import {HsCesiumQueryPopupService} from './query-popup.service';

class CesiumPickerServiceParams {
  viewer: Viewer;
  cesiumPositionClicked: Subject<any> = new Subject();
}
@Injectable({
  providedIn: 'root',
})
export class HsCesiumPickerService {
  apps: {
    [key: string]: CesiumPickerServiceParams;
  } = {default: new CesiumPickerServiceParams()};
  constructor(
    private HsCesiumQueryPopupService: HsCesiumQueryPopupService,
    private HsMapService: HsMapService,
    private hsConfig: HsConfig,
    private hsUtilsService: HsUtilsService
  ) {}

  /**
   * Get the params saved by the cesium picker service for the current app
   * @param app - App identifier
   */
  get(app: string): CesiumPickerServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new CesiumPickerServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  init(viewer: Viewer, app: string) {
    this.get(app).viewer = viewer;
    const handler = new ScreenSpaceEventHandler(
      this.get(app).viewer.scene.canvas
    );

    handler.setInputAction((movement) => {
      const pickedObject = this.get(app).viewer.scene.pick(movement.position);
      if (pickedObject && pickedObject.id && pickedObject.id.onmouseup) {
        pickedObject.id.onmouseup(pickedObject.id);
        return;
      }
    }, ScreenSpaceEventType.LEFT_UP);

    handler.setInputAction(
      (movement) => this.handleScreenInteraction(movement, 'left', app),
      ScreenSpaceEventType.LEFT_DOWN || ScreenSpaceEventType.RIGHT_DOWN
    );
    handler.setInputAction(
      (movement) => this.handleScreenInteraction(movement, 'right', app),
      ScreenSpaceEventType.RIGHT_DOWN
    );
    handler.setInputAction(
      (movement) => this.handleScreenInteraction(movement, 'left', app),
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
    handler.setInputAction((movement) => {
      if (this.hsConfig.get(app).popUpDisplay === 'hover') {
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
  handleScreenInteraction(
    movement,
    button: 'left' | 'right' | 'none',
    app: string
  ) {
    const pickRay = this.get(app).viewer.camera.getPickRay(movement.position);
    const pickedObject = this.get(app).viewer.scene.pick(movement.position);

    if (this.get(app).viewer.scene.pickPositionSupported) {
      if (this.get(app).viewer.scene.mode === SceneMode.SCENE3D) {
        const cartesian = this.get(app).viewer.scene.pickPosition(
          movement.position
        );
        if (defined(cartesian)) {
          const cartographic = Cartographic.fromCartesian(cartesian);
          const longitudeString = Math.toDegrees(cartographic.longitude);
          const latitudeString = Math.toDegrees(cartographic.latitude);
          //TODO rewrite to subject
          if (button == 'left' || 'right') {
            this.get(app).cesiumPositionClicked.next([
              longitudeString,
              latitudeString,
            ]);
          }
        }
      }
    }
    if (pickedObject?.id && this.hsConfig.get(app).popUpDisplay !== 'none') {
      if (button == 'right' && pickedObject?.id?.onRightClick) {
        pickedObject.id.onRightClick(pickedObject.id);
      }
      if (button == 'left' && pickedObject?.id?.onclick) {
        pickedObject.id.onclick(pickedObject.id);
      }
      this.HsCesiumQueryPopupService.fillFeatures(
        [
          this.HsMapService.getFeatureById(
            (pickedObject.id as Entity).properties.HsCesiumFeatureId.getValue(),
            app
          ),
        ],
        app
      );
      this.HsCesiumQueryPopupService.showPopup({pixel: movement.position}, app);
      return;
    } else {
      this.HsCesiumQueryPopupService.fillFeatures([], app);
    }
  }
}
