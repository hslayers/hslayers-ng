import '../permalink/permalink.module';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import * as Cesium from 'cesium/Source/Cesium';
import {transformExtent} from 'ol/proj';
/**
 * @param HsConfig
 * @param $rootScope
 * @param HsUtilsService
 * @param HsMapService
 * @param HsLayermanagerService
 * @param HsLayoutService
 * @param HsCesiumCameraService
 * @param HsCesiumLayersService
 * @param HsCesiumTimeService
 */
export default function (
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
  const me = this;
  let viewer;
  const BING_KEY = angular.isDefined(HsConfig.cesiumBingKey)
    ? HsConfig.cesiumBingKey
    : 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';

  /**
   * @ngdoc method
   * @name HsCesiumService#init
   * @public
   * @description Initializes Cesium map
   */
  this.init = function () {
    Cesium.Ion.defaultAccessToken =
      HsConfig.cesiumAccessToken ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA';
    window.CESIUM_BASE_URL = HsConfig.cesiumBase;
    let terrain_provider =
      HsConfig.terrain_provider ||
      Cesium.createWorldTerrain(HsConfig.createWorldTerrainOptions);
    if (HsConfig.newTerrainProviderOptions) {
      terrain_provider = new Cesium.CesiumTerrainProvider(
        HsConfig.newTerrainProviderOptions
      );
    }

    HsCesiumCameraService.setDefaultViewport();

    Cesium.BingMapsApi.defaultKey = BING_KEY;

    //TODO: research if this must be used or ignored
    const bing = new Cesium.BingMapsImageryProvider({
      url: '//dev.virtualearth.net',
      key: Cesium.BingMapsApi.defaultKey,
      mapStyle: Cesium.BingMapsStyle.AERIAL,
    });
    viewer = new Cesium.Viewer(
      HsLayoutService.contentWrapper.querySelector('.hs-cesium-container'),
      {
        timeline: angular.isDefined(HsConfig.cesiumTimeline)
          ? HsConfig.cesiumTimeline
          : false,
        animation: angular.isDefined(HsConfig.cesiumAnimation)
          ? HsConfig.cesiumAnimation
          : false,
        creditContainer: angular.isDefined(HsConfig.creditContainer)
          ? HsConfig.creditContainer
          : undefined,
        infoBox: angular.isDefined(HsConfig.cesiumInfoBox)
          ? HsConfig.cesiumInfoBox
          : true,
        terrainProvider: terrain_provider,
        imageryProvider: HsConfig.imageryProvider,
        terrainExaggeration: HsConfig.terrainExaggeration || 1.0,
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
        shadows: HsConfig.cesiumShadows || false,
        scene3DOnly: true,
        sceneModePicker: false,
      }
    );

    viewer.scene.debugShowFramesPerSecond = angular.isDefined(
      HsConfig.cesiumdDebugShowFramesPerSecond
    )
      ? HsConfig.cesiumdDebugShowFramesPerSecond
      : false;
    viewer.scene.globe.enableLighting = HsConfig.cesiumShadows || false;
    viewer.scene.globe.shadows = HsConfig.cesiumShadows || false;

    viewer.terrainProvider = terrain_provider;

    if (angular.isDefined(HsConfig.cesiumTime)) {
      viewer.clockViewModel.currentTime = HsConfig.cesiumTime;
    }

    me.viewer = viewer;
    HsCesiumCameraService.init(this);
    HsCesiumLayersService.init(this);
    HsCesiumTimeService.init(this);

    window.addEventListener('blur', () => {
      if (viewer.isDestroyed()) {
        return;
      }
      me.viewer.targetFrameRate = 5;
    });

    window.addEventListener('focus', () => {
      if (viewer.isDestroyed()) {
        return;
      }
      me.viewer.targetFrameRate = 30;
    });

    viewer.camera.moveEnd.addEventListener((e) => {
      if (!HsMapService.visible) {
        const center = HsCesiumCameraService.getCameraCenterInLngLat();
        if (center == null) {
          return;
        } //Not looking on the map but in the sky
        const viewport = HsCesiumCameraService.getViewportPolygon();
        $rootScope.$broadcast('map.sync_center', center, viewport);
      }
    });

    HsLayermanagerService.data.terrainlayers = [];
    angular.forEach(HsConfig.terrain_providers, (provider) => {
      provider.type = 'terrain';
      HsLayermanagerService.data.terrainlayers.push(provider);
    });

    $rootScope.$on('map.extent_changed', (event, data, b) => {
      const view = HsMapService.map.getView();
      if (HsMapService.visible) {
        HsCesiumCameraService.setExtentEqualToOlExtent(view);
      }
    });

    $rootScope.$on('search.zoom_to_center', (event, data) => {
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          data.coordinate[0],
          data.coordinate[1],
          15000.0
        ),
      });
    });

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const pickRay = viewer.camera.getPickRay(movement.position);
      const pickedObject = viewer.scene.pick(movement.position);
      const featuresPromise = viewer.imageryLayers.pickImageryLayerFeatures(
        pickRay,
        viewer.scene
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
      const pickedObject = viewer.scene.pick(movement.position);
      if (pickedObject && pickedObject.id && pickedObject.id.onmouseup) {
        pickedObject.id.onmouseup(pickedObject.id);
        return;
      }
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    /**
     * @param movement
     */
    function rightClickLeftDoubleClick(movement) {
      const pickRay = viewer.camera.getPickRay(movement.position);
      const pickedObject = viewer.scene.pick(movement.position);

      if (viewer.scene.pickPositionSupported) {
        if (viewer.scene.mode === Cesium.SceneMode.SCENE3D) {
          const cartesian = viewer.scene.pickPosition(movement.position);
          if (Cesium.defined(cartesian)) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            const longitudeString = Cesium.Math.toDegrees(
              cartographic.longitude
            );
            const latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
            $rootScope.$broadcast('cesium_position_clicked', [
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
    $rootScope.$broadcast('cesiummap.loaded', viewer, me);
  };

  this.dimensionChanged = function (layer, dimension) {
    layer = layer.cesium_layer;
    if (
      angular.isUndefined(layer.prm_cache) ||
      angular.isUndefined(layer.prm_cache.dimensions) ||
      angular.isUndefined(layer.prm_cache.dimensions[dimension.name])
    ) {
      return;
    }
    HsCesiumLayersService.changeLayerParam(
      layer,
      dimension.name,
      dimension.value
    );
    HsCesiumLayersService.removeLayersWithOldParams();
  };

  this.resize = function (event, size) {
    if (angular.isUndefined(size)) {
      return;
    }
    HsLayoutService.contentWrapper.querySelector(
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

    $rootScope.$broadcast('cesiummap.resized', viewer, me);
  };

  this.getCameraCenterInLngLat = HsCesiumCameraService.getCameraCenterInLngLat;
  this.linkOlLayerToCesiumLayer =
    HsCesiumLayersService.linkOlLayerToCesiumLayer;
  return me;
}
