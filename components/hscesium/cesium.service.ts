import '../permalink/permalink.module';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium/Source/Cesium.js';
import {HsCesiumCameraService} from './cesium-camera.service';
import {HsCesiumLayersService} from './cesium-layers.service';
import {HsCesiumTimeService} from './cesium-time.service';
import {HsConfig} from '../../config.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLayerManagerService} from '../layermanager';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';

export class HsCesiumService {
  BING_KEY = 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';
  viewer: any;
  constructor(
    private HsConfig: HsConfig,
    private HsMapService: HsMapService,
    private HsLayermanagerService: HsLayerManagerService,
    private HsLayoutService: HsLayoutService,
    private HsCesiumCameraService: HsCesiumCameraService,
    private HsCesiumLayersService: HsCesiumLayersService,
    private HsCesiumTimeService: HsCesiumTimeService,
    private HsEventBusService: HsEventBusService
  ) {
    'ngInject';
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
    Cesium.Ion.defaultAccessToken =
      this.HsConfig.cesiumAccessToken ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA';
    window.CESIUM_BASE_URL = this.HsConfig.cesiumBase;
    let terrain_provider =
      this.HsConfig.terrain_provider ||
      Cesium.createWorldTerrain(this.HsConfig.createWorldTerrainOptions);
    if (this.HsConfig.newTerrainProviderOptions) {
      terrain_provider = new Cesium.CesiumTerrainProvider(
        this.HsConfig.newTerrainProviderOptions
      );
    }

    this.HsCesiumCameraService.setDefaultViewport();

    Cesium.BingMapsApi.defaultKey = this.BING_KEY;

    //TODO: research if this must be used or ignored
    const bing = new Cesium.BingMapsImageryProvider({
      url: '//dev.virtualearth.net',
      key: Cesium.BingMapsApi.defaultKey,
      mapStyle: Cesium.BingMapsStyle.AERIAL,
    });
    const viewer = new Cesium.Viewer(
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
        skyBox: new Cesium.SkyBox({
          sources: {
            positiveX: require('cesium/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_px.jpg'),
            negativeX: require('cesium/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg'),
            positiveY: require('cesium/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_py.jpg'),
            negativeY: require('cesium/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_my.jpg'),
            positiveZ: require('cesium/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg'),
            negativeZ: require('cesium/Build/Cesium/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg'),
          },
        }),
        // Show Columbus View map with Web Mercator projection
        sceneMode: Cesium.SceneMode.SCENE3D,
        mapProjection: new Cesium.WebMercatorProjection(),
        shadows: this.HsConfig.cesiumShadows || false,
        scene3DOnly: true,
        sceneModePicker: false,
      }
    );

    viewer.scene.debugShowFramesPerSecond = this.HsConfig
      .cesiumdDebugShowFramesPerSecond
      ? this.HsConfig.cesiumdDebugShowFramesPerSecond
      : false;
    viewer.scene.globe.enableLighting = this.HsConfig.cesiumShadows || false;
    viewer.scene.globe.shadows = this.HsConfig.cesiumShadows || false;

    viewer.terrainProvider = terrain_provider;

    if (this.HsConfig.cesiumTime) {
      viewer.clockViewModel.currentTime = this.HsConfig.cesiumTime;
    }

    this.viewer = viewer;
    this.HsCesiumCameraService.init(this);
    this.HsCesiumLayersService.init(this);
    this.HsCesiumTimeService.init(this);

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
        destination: Cesium.Cartesian3.fromDegrees(
          data.coordinate[0],
          data.coordinate[1],
          15000.0
        ),
      });
    });

    const handler = new Cesium.ScreenSpaceEventHandler(
      this.viewer.scene.canvas
    );
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
      if (!Cesium.defined(featuresPromise)) {
        if (console) {
          console.log('No features picked.');
        }
      } else {
        Cesium.when(featuresPromise, (features) => {
          let s = '';
          if (features.length > 0) {
            for (let i = 0; i < features.length; i++) {
              s = s + features[i].data + '\n';
            }
          }
          const iframe: any = document.querySelector('.cesium-infoBox-iframe');
          if (iframe) {
            // eslint-disable-next-line angular/timeout-service
            setTimeout(() => {
              const innerDoc = iframe.contentDocument
                ? iframe.contentDocument
                : iframe.contentWindow.document;
              innerDoc.querySelector(
                '.cesium-infoBox-description'
              ).innerHTML = s.replaceAll('\n', '<br/>');
              iframe.style.height = 200 + 'px';
            }, 1000);
          }
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    handler.setInputAction((movement) => {
      const pickedObject = this.viewer.scene.pick(movement.position);
      if (pickedObject && pickedObject.id && pickedObject.id.onmouseup) {
        pickedObject.id.onmouseup(pickedObject.id);
        return;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    /**
     * @param movement
     */
    function rightClickLeftDoubleClick(movement) {
      const pickRay = this.viewer.camera.getPickRay(movement.position);
      const pickedObject = this.viewer.scene.pick(movement.position);

      if (this.viewer.scene.pickPositionSupported) {
        if (this.viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
          const cartesian = this.viewer.scene.pickPosition(movement.position);
          if (Cesium.defined(cartesian)) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const longitudeString = Cesium.Math.toDegrees(
              cartographic.longitude
            );
            const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
            this.$rootScope.$broadcast('cesium_position_clicked', [
              longitudeString,
              latitudeString,
            ]);
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
      Cesium.ScreenSpaceEventType.RIGHT_DOWN
    );
    handler.setInputAction(
      rightClickLeftDoubleClick,
      Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK
    );

    /**
     * @ngdoc event
     * @name HsCesiumService#map.loaded
     * @eventType broadcast on $rootScope
     * @description
     */
    this.HsEventBusService.cesiumLoads.next({viewer: viewer, service: this});
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

  resize(event, size) {
    if (size == undefined) {
      return;
    }
    this.HsLayoutService.contentWrapper.querySelector(
      '.hs-cesium-container'
    ).style.height = size.height + 'px';
    const timelineElement = <HTMLElement>(
      document.querySelector('.cesium-viewer-timelineContainer')
    );
    if (timelineElement) {
      timelineElement.style.right = '0';
    }
    if (document.querySelector('.cesium-viewer-bottom')) {
      const bottomElement = <HTMLElement>(
        document.querySelector('.cesium-viewer-bottom')
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
