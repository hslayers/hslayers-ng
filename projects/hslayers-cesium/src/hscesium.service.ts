import 'cesium/Build/Cesium/Widgets/widgets.css';
import BingMapsImageryProvider from 'cesium/Source/Scene/BingMapsImageryProvider';
import BingMapsStyle from 'cesium/Source/Scene/BingMapsStyle';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import Cartographic from 'cesium/Source/Core/Cartographic';
import CesiumTerrainProvider from 'cesium/Source/Core/CesiumTerrainProvider';
import Ion from 'cesium/Source/Core/Ion';
import Math from 'cesium/Source/Core/Math';
import SceneMode from 'cesium/Source/Scene/SceneMode';
import ScreenSpaceEventHandler from 'cesium/Source/Core/ScreenSpaceEventHandler';
import ScreenSpaceEventType from 'cesium/Source/Core/ScreenSpaceEventType';
import ShadowMode from 'cesium/Source/Scene/ShadowMode';
import SkyBox from 'cesium/Source/Scene/SkyBox';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import WebMercatorProjection from 'cesium/Source/Core/WebMercatorProjection';
import createWorldTerrain from 'cesium/Source/Core/createWorldTerrain';
import defined from 'cesium/Source/Core/defined';
import when from 'cesium/Source/ThirdParty/when';
import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumTimeService} from './hscesium-time.service';
import {
  HsConfig,
  HsEventBusService,
  HsLayerManagerService,
  HsLayoutService,
  HsMapService,
  HsUtilsService,
} from 'hslayers-ng';
import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumService {
  BING_KEY = 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';
  viewer: any;
  cesiumPositionClicked: Subject<any> = new Subject();

  constructor(
    public HsConfig: HsConfig,
    public HsMapService: HsMapService,
    public HsLayermanagerService: HsLayerManagerService,
    public HsLayoutService: HsLayoutService,
    public HsCesiumCameraService: HsCesiumCameraService,
    public HsCesiumLayersService: HsCesiumLayersService,
    public HsCesiumTimeService: HsCesiumTimeService,
    public HsEventBusService: HsEventBusService,
    public HsUtilsService: HsUtilsService
  ) {
    if (this.HsConfig.cesiumBingKey) {
      this.BING_KEY = this.HsConfig.cesiumBingKey;
    }
  }

  /**
   * @ngdoc method
   * @name HsCesiumService#init
   * @public
   * @description Initializes Cesium map
   */
  init() {
    Ion.defaultAccessToken =
      this.HsConfig.cesiumAccessToken ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA';
    (<any>window).CESIUM_BASE_URL = this.HsConfig.cesiumBase;
    let terrain_provider =
      this.HsConfig.terrain_provider ||
      createWorldTerrain(this.HsConfig.createWorldTerrainOptions);
    if (this.HsConfig.newTerrainProviderOptions) {
      terrain_provider = new CesiumTerrainProvider(
        this.HsConfig.newTerrainProviderOptions
      );
    }

    this.HsCesiumCameraService.setDefaultViewport();

    //TODO: research if this must be used or ignored
    const bing = new BingMapsImageryProvider({
      url: '//dev.virtualearth.net',
      key: this.BING_KEY,
      mapStyle: BingMapsStyle.AERIAL,
    });
    const viewer = new Viewer(
      this.HsLayoutService.contentWrapper.querySelector('.hs-cesium-container'),
      {
        timeline: this.HsConfig.cesiumTimeline
          ? this.HsConfig.cesiumTimeline
          : false,
        animation: this.HsConfig.cesiumAnimation
          ? this.HsConfig.cesiumAnimation
          : false,
        creditContainer: this.HsConfig.creditContainer
          ? this.HsConfig.creditContainer
          : undefined,
        infoBox: this.HsConfig.cesiumInfoBox
          ? this.HsConfig.cesiumInfoBox
          : true,
        terrainProvider: terrain_provider,
        imageryProvider: this.HsConfig.imageryProvider,
        terrainExaggeration: this.HsConfig.terrainExaggeration || 1.0,
        // Use high-res stars downloaded from https://github.com/AnalyticalGraphicsInc/cesium-assets
        skyBox: new SkyBox({
          sources: {
            positiveX: loadSkyBoxSide('tycho2t3_80_px.jpg'),
            negativeX: loadSkyBoxSide('tycho2t3_80_mx.jpg'),
            positiveY: loadSkyBoxSide('tycho2t3_80_py.jpg'),
            negativeY: loadSkyBoxSide('tycho2t3_80_my.jpg'),
            positiveZ: loadSkyBoxSide('tycho2t3_80_pz.jpg'),
            negativeZ: loadSkyBoxSide('tycho2t3_80_mz.jpg'),
          },
        }),
        // Show Columbus View map with Web Mercator projection
        sceneMode: SceneMode.SCENE3D,
        mapProjection: new WebMercatorProjection(),
        shadows: this.getShadowMode(),
        scene3DOnly: true,
        sceneModePicker: false,
      }
    );

    /**
     * @param file
     */
    function loadSkyBoxSide(file) {
      return `Textures/SkyBox/${file}`;
    }

    viewer.scene.debugShowFramesPerSecond = this.HsConfig
      .cesiumdDebugShowFramesPerSecond
      ? this.HsConfig.cesiumdDebugShowFramesPerSecond
      : false;
    viewer.scene.globe.enableLighting = this.getShadowMode();
    viewer.scene.globe.shadows = this.getShadowMode();
    viewer.terrainProvider = terrain_provider;

    if (this.HsConfig.cesiumTime) {
      viewer.clockViewModel.currentTime = this.HsConfig.cesiumTime;
    }

    this.viewer = viewer;
    this.HsCesiumCameraService.init(this.viewer);
    this.HsCesiumLayersService.init(this.viewer);
    this.HsCesiumTimeService.init(this.viewer);

    window.addEventListener('blur', () => {
      if (this.viewer.isDestroyed()) {
        return;
      }
      this.viewer.targetFrameRate = 5;
    });

    window.addEventListener('focus', () => {
      if (this.viewer.isDestroyed()) {
        return;
      }
      this.viewer.targetFrameRate = 30;
    });

    this.viewer.camera.moveEnd.addEventListener((e) => {
      if (!this.HsMapService.visible) {
        const center = this.HsCesiumCameraService.getCameraCenterInLngLat();
        if (center === null) {
          return;
        } //Not looking on the map but in the sky
        const viewport = this.HsCesiumCameraService.getViewportPolygon();
        this.HsEventBusService.mapCenterSynchronizations.next({
          center,
          viewport,
        });
      }
    });

    this.HsLayermanagerService.data.terrainlayers = [];
    if (this.HsConfig.terrain_providers) {
      for (const provider of this.HsConfig.terrain_providers) {
        provider.type = 'terrain';
        this.HsLayermanagerService.data.terrainlayers.push(provider);
      }
    }

    this.HsEventBusService.mapExtentChanges.subscribe((data) => {
      const view = this.HsMapService.map.getView();
      if (this.HsMapService.visible) {
        this.HsCesiumCameraService.setExtentEqualToOlExtent(view);
      }
    });

    this.HsEventBusService.zoomTo.subscribe((data) => {
      this.viewer.camera.setView({
        destination: Cartesian3.fromDegrees(
          data.coordinate[0],
          data.coordinate[1],
          15000.0
        ),
      });
    });

    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const pickRay = this.viewer.camera.getPickRay(movement.position);
      const pickedObject = this.viewer.scene.pick(movement.position);
      const featuresPromise = this.viewer.imageryLayers.pickImageryLayerFeatures(
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
            // eslint-disable-next-line angular/timeout-service
            setTimeout(() => {
              const innerDoc = iframe.contentDocument
                ? iframe.contentDocument
                : iframe.contentWindow.document;
              innerDoc.querySelector(
                '.cesium-infoBox-description'
              ).innerHTML = s.replace(/\n/gm, '<br/>');
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

    /**
     * @param movement
     */
    function rightClickLeftDoubleClick(movement) {
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
      if (pickedObject && pickedObject.id && pickedObject.id.onclick) {
        pickedObject.id.onRightClick(pickedObject.id);
        return;
      }
    }

    handler.setInputAction(
      rightClickLeftDoubleClick,
      ScreenSpaceEventType.RIGHT_DOWN
    );
    handler.setInputAction(
      rightClickLeftDoubleClick,
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    this.HsEventBusService.cesiumLoads.next({viewer: viewer, service: this});
  }

  private getShadowMode(): any {
    return this.HsConfig.cesiumShadows == undefined
      ? ShadowMode.DISABLED
      : this.HsConfig.cesiumShadows;
  }

  getCameraCenterInLngLat() {
    return this.HsCesiumCameraService.getCameraCenterInLngLat();
  }

  linkOlLayerToCesiumLayer(ol_layer, cesium_layer) {
    return this.HsCesiumLayersService.linkOlLayerToCesiumLayer(
      ol_layer,
      cesium_layer
    );
  }

  dimensionChanged(layer, dimension) {
    layer = layer.cesium_layer;
    if (
      layer.prm_cache == undefined ||
      layer.prm_cache.dimensions == undefined ||
      layer.prm_cache.dimensions[dimension.name] == undefined
    ) {
      return;
    }
    this.HsCesiumLayersService.changeLayerParam(
      layer,
      dimension.name,
      dimension.value
    );
    this.HsCesiumLayersService.removeLayersWithOldParams();
  }

  resize(event?, size?) {
    if (size == undefined) {
      return;
    }
    this.HsLayoutService.contentWrapper.querySelector(
      '.hs-cesium-container'
    ).style.height = size.height + 'px';
    const timelineElement = <HTMLElement>(
      this.HsLayoutService.layoutElement.querySelector(
        '.cesium-viewer-timelineContainer'
      )
    );
    if (timelineElement) {
      timelineElement.style.right = '0';
    }
    if (
      this.HsLayoutService.layoutElement.querySelector('.cesium-viewer-bottom')
    ) {
      const bottomElement = <HTMLElement>(
        this.HsLayoutService.layoutElement.querySelector(
          '.cesium-viewer-bottom'
        )
      );
      if (timelineElement) {
        bottomElement.style.bottom = '30px';
      } else {
        bottomElement.style.bottom = '0';
      }
    }

    this.HsEventBusService.cesiumResizes.next({
      viewer: this.viewer,
      service: this,
    });
  }
}
