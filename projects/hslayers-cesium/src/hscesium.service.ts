import {Injectable} from '@angular/core';

import {
  BingMapsImageryProvider,
  BingMapsStyle,
  Camera,
  Cartesian3,
  CesiumTerrainProvider,
  Ion,
  SceneMode,
  ShadowMode,
  SkyBox,
  Viewer,
  WebMercatorProjection,
  createWorldTerrain,
} from 'cesium';
import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumTimeService} from './hscesium-time.service';
import {
  HsEventBusService,
  HsLayerManagerService,
  HsLayoutService,
  HsMapService,
  HsQueryPopupComponent,
  HsUtilsService,
} from 'hslayers-ng';
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
   
   */
  get(): CesiumServiceParams {
    if (this.apps[app ?? 'default'] == undefined) {
      this.apps[app ?? 'default'] = new CesiumServiceParams();
    }
    return this.apps[app ?? 'default'];
  }

  /**
   * @public
   * Initializes Cesium map
   */
  init() {
    const appRef = this.get();
    this.checkForBingKey();
    this.HsCesiumConfig.cesiumConfigChanges.subscribe(() => {
      this.checkForBingKey();
    });
    try {
      Ion.defaultAccessToken =
        this.HsCesiumConfig.get().cesiumAccessToken ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA';
      if (!this.HsCesiumConfig.get().cesiumBase) {
        console.error(
          'Please set HsCesiumConfig.get().cesiumBase to the directory where cesium assets will be copied to'
        );
      }
      (<any>window).CESIUM_BASE_URL = this.HsCesiumConfig.get().cesiumBase;
      let terrain_provider =
        this.HsCesiumConfig.get().terrain_provider ||
        createWorldTerrain(
          this.HsCesiumConfig.get().createWorldTerrainOptions
        );
      if (this.HsCesiumConfig.get().newTerrainProviderOptions) {
        terrain_provider = new CesiumTerrainProvider(
          this.HsCesiumConfig.get().newTerrainProviderOptions
        );
      }

      const defaultViewport =
        this.HsCesiumCameraService.getDefaultViewport();
      if (defaultViewport) {
        Camera.DEFAULT_VIEW_RECTANGLE = defaultViewport.rectangle;
        Camera.DEFAULT_VIEW_FACTOR = defaultViewport.viewFactor;
      } else {
        console.error('Please set HsConfig.get().default_view');
      }

      //TODO: research if this must be used or ignored
      const bing = new BingMapsImageryProvider({
        url: '//dev.virtualearth.net',
        key: appRef.BING_KEY,
        mapStyle: BingMapsStyle.AERIAL,
      });

      const viewer = new Viewer(
        this.HsLayoutService.get().contentWrapper.querySelector(
          '.hs-cesium-container'
        ),
        {
          timeline: this.HsCesiumConfig.get().cesiumTimeline
            ? this.HsCesiumConfig.get().cesiumTimeline
            : false,
          animation: this.HsCesiumConfig.get().cesiumAnimation
            ? this.HsCesiumConfig.get().cesiumAnimation
            : false,
          creditContainer: this.HsCesiumConfig.get().creditContainer
            ? this.HsCesiumConfig.get().creditContainer
            : undefined,
          infoBox: this.HsCesiumConfig.get().cesiumInfoBox
            ? this.HsCesiumConfig.get().cesiumInfoBox
            : false,
          terrainProvider: terrain_provider,
          imageryProvider: this.HsCesiumConfig.get().imageryProvider,
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

      viewer.scene.debugShowFramesPerSecond = this.HsCesiumConfig.get()
        .cesiumDebugShowFramesPerSecond
        ? this.HsCesiumConfig.get().cesiumDebugShowFramesPerSecond
        : false;
      viewer.scene.globe.enableLighting = this.getShadowMode();
      viewer.scene.globe.shadows = this.getShadowMode();
      viewer.scene.globe.terrainExaggeration =
        this.HsCesiumConfig.get().terrainExaggeration || 1.0;
      viewer.terrainProvider = terrain_provider;

      if (this.HsCesiumConfig.get().cesiumTime) {
        viewer.clockViewModel.currentTime =
          this.HsCesiumConfig.get().cesiumTime;
      }

      appRef.viewer = viewer;
      this.HsCesiumCameraService.init(appRef.viewer);
      this.HsCesiumLayersService.init(appRef.viewer);
      this.HsCesiumTimeService.init(appRef.viewer);

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
            this.HsCesiumCameraService.getCameraCenterInLngLat();
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

      this.HsLayermanagerService.get().data.terrainlayers = [];
      if (this.HsCesiumConfig.get().terrain_providers) {
        for (const provider of this.HsCesiumConfig.get().terrain_providers) {
          provider.type = 'terrain';
          this.HsLayermanagerService.get().data.terrainlayers.push(provider);
        }
      }

      this.HsEventBusService.mapExtentChanges.subscribe(() => {
        const view = this.HsMapService.getMap().getView();
        if (this.HsMapService.visible) {
          this.HsCesiumCameraService.setExtentEqualToOlExtent(view);
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

      this.HsCesiumPicker.init(appRef.viewer);
      this.hsCesiumQueryPopupService.init();
      this.HsCesiumPicker.get().cesiumPositionClicked.subscribe(
        (position) => {
          appRef.cesiumPositionClicked.next(position);
        }
      );

      //Remove overlays registered when init was called last time (when switching between 2d/3d)
      for (const p of this.HsLayoutService.hsOverlayPanelContainerService.get(
        app
      ).panels) {
        if (this.HsUtilsService.instOf(p, HsQueryPopupComponent)) {
          this.HsLayoutService.hsOverlayPanelContainerService.destroy(p);
        }
      }

      this.HsLayoutService.createOverlay(HsQueryPopupComponent, {
        service: this.hsCesiumQueryPopupService,
      });

      this.HsEventBusService.cesiumLoads.next({viewer: viewer, service: this});
    } catch (ex) {
      console.error(ex);
    }
  }

  private getShadowMode(): any {
    return this.HsCesiumConfig.get().cesiumShadows == undefined
      ? ShadowMode.DISABLED
      : this.HsCesiumConfig.get().cesiumShadows;
  }
  checkForBingKey(): void {
    if (this.HsCesiumConfig.get().cesiumBingKey) {
      this.get().BING_KEY = this.HsCesiumConfig.get().cesiumBingKey;
    }
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

  resize( size?) {
    if (size == undefined) {
      return;
    }
    this.HsLayoutService.get().contentWrapper.querySelector(
      '.hs-cesium-container'
    ).style.height = size.height + 'px';
    const timelineElement = <HTMLElement>(
      this.HsLayoutService.get().layoutElement.querySelector(
        '.cesium-viewer-timelineContainer'
      )
    );
    if (timelineElement) {
      timelineElement.style.right = '0';
    }
    if (
      this.HsLayoutService.get().layoutElement.querySelector(
        '.cesium-viewer-bottom'
      )
    ) {
      const bottomElement = <HTMLElement>(
        this.HsLayoutService.get().layoutElement.querySelector(
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
      viewer: this.get().viewer,
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
