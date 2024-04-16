import {Injectable} from '@angular/core';

import {
  Camera,
  Cartesian3,
  ImageryLayer,
  Ion,
  SceneMode,
  ShadowMode,
  SkyBox,
  TerrainProvider,
  Viewer,
  WebMercatorProjection,
  createWorldTerrainAsync,
} from 'cesium';
import {Subject, takeUntil} from 'rxjs';

import {HslayersService} from 'hslayers-ng/core';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerManagerService} from 'hslayers-ng/services/layer-manager';
import {HsLayoutService} from 'hslayers-ng/services/layout';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsMapService} from 'hslayers-ng/services/map';
import {HsOverlayConstructorService} from 'hslayers-ng/services/panel-constructor';
import {HsQueryPopupComponent} from 'hslayers-ng/common/query-popup';
import {HsShareUrlService} from 'hslayers-ng/components/share';
import {HsUtilsService} from 'hslayers-ng/services/utils';

import {HsCesiumCameraService} from './hscesium-camera.service';
import {HsCesiumConfig} from './hscesium-config.service';
import {HsCesiumLayersService} from './hscesium-layers.service';
import {HsCesiumPickerService} from './picker.service';
import {HsCesiumQueryPopupService} from './query-popup.service';
import {HsCesiumTimeService} from './hscesium-time.service';

@Injectable({
  providedIn: 'root',
})
export class HsCesiumService {
  BING_KEY = 'Ak5NFHBx3tuU85MOX4Lo-d2JP0W8amS1IHVveZm4TIY9fmINbSycLR8rVX9yZG82';
  viewer: any;
  visible = true;
  cesiumPositionClicked: Subject<any> = new Subject();

  private end: Subject<void>;
  private windowListeners = new Map<string, any>();

  constructor(
    public HsMapService: HsMapService,
    public HsLayermanagerService: HsLayerManagerService,
    public HsLayoutService: HsLayoutService,
    private hsLog: HsLogService,
    public HsCesiumCameraService: HsCesiumCameraService,
    public HsCesiumLayersService: HsCesiumLayersService,
    public HsCesiumTimeService: HsCesiumTimeService,
    public HsEventBusService: HsEventBusService,
    public HsUtilsService: HsUtilsService,
    public hsCesiumConfig: HsCesiumConfig,
    private HsCesiumPicker: HsCesiumPickerService,
    private hsCesiumQueryPopupService: HsCesiumQueryPopupService,
    private HslayersService: HslayersService,
    private hsOverlayConstructorService: HsOverlayConstructorService,
    private hsShareUrlService: HsShareUrlService,
  ) {}

  /**
   * Initializes Cesium map
   * @public
   */
  async init() {
    this.end = new Subject();
    this.checkForBingKey();
    this.hsCesiumConfig.cesiumConfigChanges
      .pipe(takeUntil(this.end))
      .subscribe(() => {
        this.checkForBingKey();
      });
    try {
      Ion.defaultAccessToken =
        this.hsCesiumConfig.cesiumAccessToken ||
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIzZDk3ZmM0Mi01ZGFjLTRmYjQtYmFkNC02NTUwOTFhZjNlZjMiLCJpZCI6MTE2MSwiaWF0IjoxNTI3MTYxOTc5fQ.tOVBzBJjR3mwO3osvDVB_RwxyLX7W-emymTOkfz6yGA';
      if (!this.hsCesiumConfig.cesiumBase) {
        this.hsLog.error(
          'Please set HsCesiumConfig.cesiumBase to the directory where Cesium assets will be copied to',
        );
      }
      (<any>window).CESIUM_BASE_URL = this.hsCesiumConfig.cesiumBase;
      let terrainProvider: TerrainProvider;
      if (this.hsCesiumConfig.terrainLayers?.length > 0) {
        let activeLayer = this.hsCesiumConfig.terrainLayers.find(
          (layer) => layer.active,
        );
        if (!activeLayer) {
          this.hsCesiumConfig.terrainLayers[0].active = true;
          activeLayer = this.hsCesiumConfig.terrainLayers[0];
        }
        terrainProvider =
          await this.HsCesiumLayersService.createTerrainProviderFromUrl(
            activeLayer.url,
            activeLayer.options,
          );
      } else {
        terrainProvider = await createWorldTerrainAsync();
        this.hsCesiumConfig.terrainLayers = [
          {
            title: 'Cesium World Terrain',
            url: 'https://assets.agi.com/stk-terrain/v1/tilesets/world/tiles',
            active: true,
          },
        ];
      }

      const defaultViewport = this.HsCesiumCameraService.getDefaultViewport();
      if (defaultViewport) {
        Camera.DEFAULT_VIEW_RECTANGLE = defaultViewport.rectangle;
        Camera.DEFAULT_VIEW_FACTOR = defaultViewport.viewFactor;
      } else {
        this.hsLog.error('Please set HsConfig.default_view');
      }

      const viewer = new Viewer(
        this.HsLayoutService.contentWrapper.querySelector(
          '.hs-cesium-container',
        ),
        {
          timeline: this.hsCesiumConfig.cesiumTimeline ?? false,
          animation: this.hsCesiumConfig.cesiumAnimation ?? false,
          creditContainer: this.hsCesiumConfig.creditContainer ?? undefined,
          infoBox: this.hsCesiumConfig.cesiumInfoBox ?? false,
          fullscreenButton: this.hsCesiumConfig.cesiumFullscreenButton ?? true,
          geocoder: this.hsCesiumConfig.cesiumGeocoder ?? false,
          terrainProvider: terrainProvider,
          baseLayerPicker: this.hsCesiumConfig.cesiumBaseLayerPicker ?? false,
          baseLayer: this.hsCesiumConfig.imageryProvider
            ? new ImageryLayer(this.hsCesiumConfig.imageryProvider, {})
            : false,
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
          shadows: !!this.getShadowMode(),
          scene3DOnly: true,
          sceneModePicker: false,
        },
      );

      viewer.scene.debugShowFramesPerSecond =
        this.hsCesiumConfig.cesiumDebugShowFramesPerSecond ?? false;
      viewer.scene.globe.enableLighting = !!this.getShadowMode();
      viewer.scene.globe.shadows = this.getShadowMode();
      viewer.scene.globe.terrainExaggeration =
        this.hsCesiumConfig.terrainExaggeration || 1.0;
      viewer.terrainProvider = terrainProvider;

      if (this.hsCesiumConfig.cesiumTime) {
        viewer.clockViewModel.currentTime = this.hsCesiumConfig.cesiumTime;
      }

      this.viewer = viewer;

      const blur = window.addEventListener('blur', () => {
        if (this.viewer.isDestroyed()) {
          return;
        }
        this.viewer.targetFrameRate = 5;
      });
      this.windowListeners.set('blur', blur);

      const focus = window.addEventListener('focus', () => {
        if (this.viewer.isDestroyed()) {
          return;
        }
        this.viewer.targetFrameRate = 30;
      });
      this.windowListeners.set('focus', focus);

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

      this.HsLayermanagerService.data.terrainLayers = [];
      if (this.hsCesiumConfig.terrainLayers) {
        for (const provider of this.hsCesiumConfig.terrainLayers) {
          provider.type = 'terrain';
          this.HsLayermanagerService.data.terrainLayers.push(provider);
        }
      }

      /**
       * UNUSED:No trigger found in HSL or HSL-Cesium
       */
      this.HsEventBusService.zoomTo
        .pipe(takeUntil(this.end))
        .subscribe((data) => {
          this.viewer.camera.setView({
            destination: Cartesian3.fromDegrees(
              data.coordinate[0],
              data.coordinate[1],
              15000.0,
            ),
          });
        });
      this.hsCesiumConfig.viewerLoaded.next(this.viewer);

      this.HsCesiumPicker.cesiumPositionClicked
        .pipe(takeUntil(this.end))
        .subscribe((position) => {
          this.cesiumPositionClicked.next(position);
        });

      //Remove overlays registered when init was called last time (when switching between 2d/3d)
      for (const p of this.hsOverlayConstructorService.panels) {
        if (this.HsUtilsService.instOf(p, HsQueryPopupComponent)) {
          this.hsOverlayConstructorService.destroy(p);
        }
      }

      this.hsOverlayConstructorService.create(HsQueryPopupComponent, {
        service: this.hsCesiumQueryPopupService,
      });

      this.HsEventBusService.cesiumLoads.next({viewer: viewer, service: this});
    } catch (ex) {
      this.hsLog.error(ex);
    }
  }

  cesiumDisabled() {
    this.viewer.destroy();

    this.windowListeners.forEach((value, key) => {
      window.removeEventListener(key, value);
    });
    this.windowListeners.clear();

    this.end.next();
    this.end.complete();
  }

  private getShadowMode() {
    return this.hsCesiumConfig.cesiumShadows == undefined
      ? ShadowMode.DISABLED
      : this.hsCesiumConfig.cesiumShadows;
  }

  checkForBingKey(): void {
    if (this.hsCesiumConfig.cesiumBingKey) {
      this.BING_KEY = this.hsCesiumConfig.cesiumBingKey;
    }
  }

  getCameraCenterInLngLat() {
    return this.HsCesiumCameraService.getCameraCenterInLngLat();
  }

  linkOlLayerToCesiumLayer(ol_layer, cesium_layer) {
    return this.HsCesiumLayersService.linkOlLayerToCesiumLayer(
      ol_layer,
      cesium_layer,
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
      dimension.value,
    );
    this.HsCesiumLayersService.removeLayersWithOldParams();
  }

  /**
   * Resize cesium container
   * @param size - Size of OL map container
   */
  resize(size: {height: number; width: number}) {
    if (size == undefined) {
      return;
    }
    this.HsLayoutService.contentWrapper.querySelector(
      '.hs-cesium-container',
    ).style.height = size.height + 'px';
    const timelineElement = <HTMLElement>(
      this.HsLayoutService.layoutElement.querySelector(
        '.cesium-viewer-timelineContainer',
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
          '.cesium-viewer-bottom',
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

  /**
   * Toggles between Cesium and OL maps by setting HsMapService.visible property which is monitored by ngIf.
   */
  toggleCesiumMap() {
    this.HsMapService.visible = !this.HsMapService.visible;
    this.visible = !this.HsMapService.visible;
    this.hsShareUrlService.updateCustomParams({
      view: this.HsMapService.visible ? '2d' : '3d',
    });
    if (this.HsMapService.visible) {
      this.cesiumDisabled();
      this.HslayersService.mapSizeUpdates();
    } else {
      const view = this.HsMapService.getMap().getView();
      if (this.HsMapService.visible) {
        this.HsCesiumCameraService.setExtentEqualToOlExtent(view);
      }
      this.init();
      this.resize({
        width: this.HsMapService.mapElement.offsetWidth,
        height: this.HsMapService.mapElement.offsetHeight,
      });
    }
    this.HsEventBusService.mapLibraryChanges.next(
      this.visible ? 'cesium' : 'ol',
    );
  }
}

function loadSkyBoxSide(file) {
  return `${(<any>window).CESIUM_BASE_URL}Assets/Textures/SkyBox/${file}`;
}
