import {Injectable} from '@angular/core';

import BingMapsImageryProvider from 'cesium/Source/Scene/BingMapsImageryProvider';
import BingMapsStyle from 'cesium/Source/Scene/BingMapsStyle';
import Camera from 'cesium/Source/Scene/Camera';
import Cartesian3 from 'cesium/Source/Core/Cartesian3';
import CesiumTerrainProvider from 'cesium/Source/Core/CesiumTerrainProvider';
import Ion from 'cesium/Source/Core/Ion';
import SceneMode from 'cesium/Source/Scene/SceneMode';
import ShadowMode from 'cesium/Source/Scene/ShadowMode';
import SkyBox from 'cesium/Source/Scene/SkyBox';
import Viewer from 'cesium/Source/Widgets/Viewer/Viewer';
import WebMercatorProjection from 'cesium/Source/Core/WebMercatorProjection';
import createWorldTerrain from 'cesium/Source/Core/createWorldTerrain';
import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumTimeService} from './hscesium-time.service';
import {HsEventBusService} from 'hslayers-ng';
import {HsLayerManagerService} from 'hslayers-ng';
import {HsLayoutService} from 'hslayers-ng';
import {HsMapService} from 'hslayers-ng';
import {HsQueryPopupComponent} from 'hslayers-ng';
import {HsUtilsService} from 'hslayers-ng';
import {Subject} from 'rxjs';

import {HsCesiumConfig} from './hscesium-config.service';
import {HsCesiumPickerService} from './picker.service';
import {HsCesiumQueryPopupService} from './query-popup.service';

class CesiumServiceParams {
  BING_KEY = 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';
  viewer: any;
  cesiumPositionClicked: Subject<any> = new Subject();
}
@Injectable({
  providedIn: 'root',
})
export class HsCesiumService {
  apps: {
    [key: string]: CesiumServiceParams;
  } = {default: new CesiumServiceParams()};

  constructor(
    public HsMapService: HsMapService,
    public HsLayermanagerService: HsLayerManagerService,
    public HsLayoutService: HsLayoutService,
    public HsCesiumCameraService: HsCesiumCameraService,
    public HsCesiumLayersService: HsCesiumLayersService,
    public HsCesiumTimeService: HsCesiumTimeService,
    public HsEventBusService: HsEventBusService,
    public HsUtilsService: HsUtilsService,
    public HsCesiumConfig: HsCesiumConfig,
    private HsCesiumPicker: HsCesiumPickerService,
    private hsCesiumQueryPopupService: HsCesiumQueryPopupService
  ) {}

  /**
   * Get the params saved by the cesium service for the current app
   * @param app - App identifier
   */
  get(app: string): CesiumServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new CesiumServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * @public
   * Initializes Cesium map
   */
  init(app: string) {
    const appRef = this.get(app);
    this.checkForBingKey(app);
    this.HsCesiumConfig.cesiumConfigChanges.subscribe(() => {
      this.checkForBingKey(app);
    });
    try {
      Ion.defaultAccessToken =
        this.HsCesiumConfig.get(app).cesiumAccessToken ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA';
      if (!this.HsCesiumConfig.get(app).cesiumBase) {
        console.error(
          'Please set HsCesiumConfig.get(app).cesiumBase to the directory where cesium assets will be copied to'
        );
      }
      (<any>window).CESIUM_BASE_URL = this.HsCesiumConfig.get(app).cesiumBase;
      let terrain_provider =
        this.HsCesiumConfig.get(app).terrain_provider ||
        createWorldTerrain(
          this.HsCesiumConfig.get(app).createWorldTerrainOptions
        );
      if (this.HsCesiumConfig.get(app).newTerrainProviderOptions) {
        terrain_provider = new CesiumTerrainProvider(
          this.HsCesiumConfig.get(app).newTerrainProviderOptions
        );
      }

      const defaultViewport =
        this.HsCesiumCameraService.getDefaultViewport(app);
      if (defaultViewport) {
        Camera.DEFAULT_VIEW_RECTANGLE = defaultViewport.rectangle;
        Camera.DEFAULT_VIEW_FACTOR = defaultViewport.viewFactor;
      } else {
        console.error('Please set HsConfig.get(app).default_view');
      }

      //TODO: research if this must be used or ignored
      const bing = new BingMapsImageryProvider({
        url: '//dev.virtualearth.net',
        key: appRef.BING_KEY,
        mapStyle: BingMapsStyle.AERIAL,
      });

      const viewer = new Viewer(
        this.HsLayoutService.get(app).contentWrapper.querySelector(
          '.hs-cesium-container'
        ),
        {
          timeline: this.HsCesiumConfig.get(app).cesiumTimeline
            ? this.HsCesiumConfig.get(app).cesiumTimeline
            : false,
          animation: this.HsCesiumConfig.get(app).cesiumAnimation
            ? this.HsCesiumConfig.get(app).cesiumAnimation
            : false,
          creditContainer: this.HsCesiumConfig.get(app).creditContainer
            ? this.HsCesiumConfig.get(app).creditContainer
            : undefined,
          infoBox: this.HsCesiumConfig.get(app).cesiumInfoBox
            ? this.HsCesiumConfig.get(app).cesiumInfoBox
            : false,
          terrainProvider: terrain_provider,
          imageryProvider: this.HsCesiumConfig.get(app).imageryProvider,
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
          shadows: this.getShadowMode(app),
          scene3DOnly: true,
          sceneModePicker: false,
        }
      );

      viewer.scene.debugShowFramesPerSecond = this.HsCesiumConfig.get(app)
        .cesiumDebugShowFramesPerSecond
        ? this.HsCesiumConfig.get(app).cesiumDebugShowFramesPerSecond
        : false;
      viewer.scene.globe.enableLighting = this.getShadowMode(app);
      viewer.scene.globe.shadows = this.getShadowMode(app);
      viewer.scene.globe.terrainExaggeration =
        this.HsCesiumConfig.get(app).terrainExaggeration || 1.0;
      viewer.terrainProvider = terrain_provider;

      if (this.HsCesiumConfig.get(app).cesiumTime) {
        viewer.clockViewModel.currentTime =
          this.HsCesiumConfig.get(app).cesiumTime;
      }

      appRef.viewer = viewer;
      this.HsCesiumCameraService.init(appRef.viewer, app);
      this.HsCesiumLayersService.init(appRef.viewer, app);
      this.HsCesiumTimeService.init(appRef.viewer, app);

      window.addEventListener('blur', () => {
        if (appRef.viewer.isDestroyed()) {
          return;
        }
        appRef.viewer.targetFrameRate = 5;
      });

      window.addEventListener('focus', () => {
        if (appRef.viewer.isDestroyed()) {
          return;
        }
        appRef.viewer.targetFrameRate = 30;
      });

      appRef.viewer.camera.moveEnd.addEventListener((e) => {
        if (!this.HsMapService.visible) {
          const center =
            this.HsCesiumCameraService.getCameraCenterInLngLat(app);
          if (center === null) {
            return;
          } //Not looking on the map but in the sky
          const viewport = this.HsCesiumCameraService.getViewportPolygon(app);
          this.HsEventBusService.mapCenterSynchronizations.next({
            center,
            viewport,
            app,
          });
        }
      });

      this.HsLayermanagerService.get(app).data.terrainlayers = [];
      if (this.HsCesiumConfig.get(app).terrain_providers) {
        for (const provider of this.HsCesiumConfig.get(app).terrain_providers) {
          provider.type = 'terrain';
          this.HsLayermanagerService.get(app).data.terrainlayers.push(provider);
        }
      }

      this.HsEventBusService.mapExtentChanges.subscribe(({app}) => {
        const view = this.HsMapService.getMap(app).getView();
        if (this.HsMapService.visible) {
          this.HsCesiumCameraService.setExtentEqualToOlExtent(view, app);
        }
      });

      this.HsEventBusService.zoomTo.subscribe((data) => {
        appRef.viewer.camera.setView({
          destination: Cartesian3.fromDegrees(
            data.coordinate[0],
            data.coordinate[1],
            15000.0
          ),
        });
      });

      this.HsCesiumPicker.init(appRef.viewer, app);
      this.hsCesiumQueryPopupService.init(app);
      this.HsCesiumPicker.get(app).cesiumPositionClicked.subscribe(
        (position) => {
          appRef.cesiumPositionClicked.next(position);
        }
      );

      this.HsLayoutService.createOverlay(HsQueryPopupComponent, app, {
        service: this.hsCesiumQueryPopupService,
        app,
      });

      this.HsEventBusService.cesiumLoads.next({viewer: viewer, service: this});
    } catch (ex) {
      console.error(ex);
    }
  }

  private getShadowMode(app: string): any {
    return this.HsCesiumConfig.get(app).cesiumShadows == undefined
      ? ShadowMode.DISABLED
      : this.HsCesiumConfig.get(app).cesiumShadows;
  }
  checkForBingKey(app: string): void {
    if (this.HsCesiumConfig.get(app).cesiumBingKey) {
      this.get(app).BING_KEY = this.HsCesiumConfig.get(app).cesiumBingKey;
    }
  }
  getCameraCenterInLngLat(app: string) {
    return this.HsCesiumCameraService.getCameraCenterInLngLat(app);
  }

  linkOlLayerToCesiumLayer(ol_layer, cesium_layer, app: string) {
    return this.HsCesiumLayersService.linkOlLayerToCesiumLayer(
      ol_layer,
      cesium_layer,
      app
    );
  }

  dimensionChanged(layer, dimension, app: string) {
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
      dimension.value,
      app
    );
    this.HsCesiumLayersService.removeLayersWithOldParams(app);
  }

  resize(app: string, size?) {
    if (size == undefined) {
      return;
    }
    this.HsLayoutService.get(app).contentWrapper.querySelector(
      '.hs-cesium-container'
    ).style.height = size.height + 'px';
    const timelineElement = <HTMLElement>(
      this.HsLayoutService.get(app).layoutElement.querySelector(
        '.cesium-viewer-timelineContainer'
      )
    );
    if (timelineElement) {
      timelineElement.style.right = '0';
    }
    if (
      this.HsLayoutService.get(app).layoutElement.querySelector(
        '.cesium-viewer-bottom'
      )
    ) {
      const bottomElement = <HTMLElement>(
        this.HsLayoutService.get(app).layoutElement.querySelector(
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
      viewer: this.get(app).viewer,
      service: this,
    });
  }
}

/**
 * @param file -
 */
function loadSkyBoxSide(file) {
  return `${(<any>window).CESIUM_BASE_URL}Assets/Textures/SkyBox/${file}`;
}
