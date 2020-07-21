import '../permalink/permalink.module';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium/Source/Cesium';

export class HsCesiumService {
  constructor(
    HsConfig,
    $rootScope,
    HsMapService,
    HsLayermanagerService,
    HsLayoutService,
    HsCesiumCameraService,
    HsCesiumLayersService,
    HsCesiumTimeService
  ) {
    'ngInject';
    this.BING_KEY = 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';
    if (angular.isDefined(HsConfig.cesiumBingKey)) {
      this.BING_KEY = HsConfig.cesiumBingKey;
    }
    Object.assign(this, {
      HsConfig,
      $rootScope,
      HsMapService,
      HsLayermanagerService,
      HsLayoutService,
      HsCesiumCameraService,
      HsCesiumLayersService,
      HsCesiumTimeService,
    });
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
        timeline: angular.isDefined(this.HsConfig.cesiumTimeline)
          ? this.HsConfig.cesiumTimeline
          : false,
        animation: angular.isDefined(this.HsConfig.cesiumAnimation)
          ? this.HsConfig.cesiumAnimation
          : false,
        creditContainer: angular.isDefined(this.HsConfig.creditContainer)
          ? this.HsConfig.creditContainer
          : undefined,
        infoBox: angular.isDefined(this.HsConfig.cesiumInfoBox)
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

    viewer.scene.debugShowFramesPerSecond = angular.isDefined(
      this.HsConfig.cesiumdDebugShowFramesPerSecond
    )
      ? this.HsConfig.cesiumdDebugShowFramesPerSecond
      : false;
    viewer.scene.globe.enableLighting = this.HsConfig.cesiumShadows || false;
    viewer.scene.globe.shadows = this.HsConfig.cesiumShadows || false;

    viewer.terrainProvider = terrain_provider;

    if (angular.isDefined(this.HsConfig.cesiumTime)) {
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
        this.$rootScope.$broadcast('map.sync_center', center, viewport);
      }
    });

    this.HsLayermanagerService.data.terrainlayers = [];
    angular.forEach(this.HsConfig.terrain_providers, (provider) => {
      provider.type = 'terrain';
      this.HsLayermanagerService.data.terrainlayers.push(provider);
    });

    this.$rootScope.$on('map.extent_changed', (event, data, b) => {
      const view = this.HsMapService.map.getView();
      if (this.HsMapService.visible) {
        this.HsCesiumCameraService.setExtentEqualToOlExtent(view);
      }
    });

    this.$rootScope.$on('search.zoom_to_center', (event, data) => {
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
          const iframe = document.querySelector('.cesium-infoBox-iframe');
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
    this.$rootScope.$broadcast('cesiummap.loaded', viewer, this);

    this.getCameraCenterInLngLat = () =>
      this.HsCesiumCameraService.getCameraCenterInLngLat();
    this.linkOlLayerToCesiumLayer = (ol_layer, cesium_layer) =>
      this.HsCesiumLayersService.linkOlLayerToCesiumLayer(
        ol_layer,
        cesium_layer
      );
  }

  dimensionChanged(layer, dimension) {
    layer = layer.cesium_layer;
    if (
      angular.isUndefined(layer.prm_cache) ||
      angular.isUndefined(layer.prm_cache.dimensions) ||
      angular.isUndefined(layer.prm_cache.dimensions[dimension.name])
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
    if (angular.isUndefined(size)) {
      return;
    }
    this.HsLayoutService.contentWrapper.querySelector(
      '.hs-cesium-container'
    ).style.height = size.height + 'px';
    if (document.querySelector('.cesium-viewer-timelineContainer')) {
      document.querySelector('.cesium-viewer-timelineContainer').style.right =
        '0';
    }
    if (document.querySelector('.cesium-viewer-bottom')) {
      if (document.querySelector('.cesium-viewer-timelineContainer')) {
        document.querySelector('.cesium-viewer-bottom').style.bottom = '30px';
      } else {
        document.querySelector('.cesium-viewer-bottom').style.bottom = '0';
      }
    }

    this.$rootScope.$broadcast('cesiummap.resized', this.viewer, this);
  }
}
