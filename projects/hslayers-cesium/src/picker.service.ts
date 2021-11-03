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
import when from 'cesium/Source/ThirdParty/when';

import {HsCesiumQueryPopupService} from './hover-popup.service';
import {HsLayoutService, HsMapService} from 'hslayers-ng';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumPicker {
  viewer: Viewer;
  cesiumPositionClicked: Subject<any> = new Subject();

  constructor(
    private HsLayoutService: HsLayoutService,
    private HsCesiumQueryPopupService: HsCesiumQueryPopupService,
    private HsMapService: HsMapService
  ) {}

  init(viewer: Viewer) {
    this.viewer = viewer;
    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const pickRay = this.viewer.camera.getPickRay(movement.position);
      const pickedObject = this.viewer.scene.pick(movement.position);
      const featuresPromise =
        this.viewer.imageryLayers.pickImageryLayerFeatures(
          pickRay,
          this.viewer.scene
        );
      if (pickedObject && pickedObject.id && pickedObject.id.onclick) {
        pickedObject.id.onclick(pickedObject.id);
        return;
      }
      if (!defined(featuresPromise)) {
        if (console) {
          console.log('No features picked.');
        }
      } else {
        when(featuresPromise, (features) => {
          let s = '';
          if (features.length > 0) {
            for (let i = 0; i < features.length; i++) {
              s = s + features[i].data + '\n';
            }
          }
          const iframe: any = this.HsLayoutService.layoutElement.querySelector(
            '.cesium-infoBox-iframe'
          );
          if (iframe) {
            setTimeout(() => {
              const innerDoc = iframe.contentDocument
                ? iframe.contentDocument
                : iframe.contentWindow.document;
              innerDoc.querySelector('.cesium-infoBox-description').innerHTML =
                s.replace(/\n/gm, '<br/>');
              iframe.style.height = 200 + 'px';
            }, 1000);
          }
        });
      }
    }, ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((movement) => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (pickedObject && pickedObject.id && pickedObject.id.onmouseup) {
        pickedObject.id.onmouseup(pickedObject.id);
        return;
      }
    }, ScreenSpaceEventType.LEFT_UP);

    handler.setInputAction(
      (movement) => this.rightClickLeftDoubleClick(movement),
      ScreenSpaceEventType.RIGHT_DOWN
    );
    handler.setInputAction(
      (movement) => this.rightClickLeftDoubleClick(movement),
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );
  }
  /**
   * @param movement -
   */
  rightClickLeftDoubleClick(movement) {
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
          this.cesiumPositionClicked.next([longitudeString, latitudeString]);
        }
      }
    }
    if (pickedObject && pickedObject.id) {
      if (pickedObject.id.onclick) {
        pickedObject.id.onRightClick(pickedObject.id);
      }
      this.HsCesiumQueryPopupService.fillFeatures([
        this.HsMapService.getFeatureById(
          (pickedObject.id as Entity).properties.HsCesiumFeatureId.getValue()
        ),
      ]);
      this.HsCesiumQueryPopupService.showPopup({pixel: movement.position});
      return;
    }
  }
}
