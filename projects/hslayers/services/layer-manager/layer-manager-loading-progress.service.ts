import {Injectable, NgZone} from '@angular/core';
import {Subject, buffer, debounceTime, pairwise} from 'rxjs';

import {Cluster, Source} from 'ol/source';
import {Feature} from 'ol';
import {
  Image as ImageLayer,
  Layer,
  Tile,
  Vector as VectorLayer,
} from 'ol/layer';

import {HsConfig} from 'hslayers-ng/config';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLanguageService} from 'hslayers-ng/services/language';
import {HsLayerDescriptor, HsLayerLoadProgress} from 'hslayers-ng/types';
import {HsLogService} from 'hslayers-ng/services/log';
import {HsToastService} from 'hslayers-ng/common/toast';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {
  getBase,
  getShowInLayerManager,
  getTitle,
} from 'hslayers-ng/common/extensions';

@Injectable({
  providedIn: 'root',
})
export class HsLayerManagerLoadingProgressService {
  constructor(
    private hsConfig: HsConfig,
    private hsLog: HsLogService,
    private zone: NgZone,
    private hsUtilsService: HsUtilsService,
    private hsToastService: HsToastService,
    private hsLanguageService: HsLanguageService,
    private hsEventBusService: HsEventBusService,
  ) {}

  /**
   * Create events for checking whether the layer is being loaded or is loaded
   * @param layer - Layer which is being added
   */
  loadingEvents(layer: HsLayerDescriptor): void {
    const olLayer = layer.layer;
    const showInLM = getShowInLayerManager(olLayer);
    if (
      (getBase(olLayer) && this.hsConfig.componentsEnabled.basemapGallery) ||
      !(showInLM === undefined || showInLM == true)
    ) {
      return;
    }
    const source: any = olLayer.get('cluster')
      ? (olLayer.getSource() as Cluster<Feature>).getSource()
      : olLayer.getSource();
    if (!source) {
      this.hsLog.error(`Layer ${getTitle(olLayer)} has no source`);
      return;
    }
    const loadProgress: HsLayerLoadProgress = {
      pending: 0,
      total: 0,
      loadError: 0,
      loaded: true,
      error: undefined,
      percents: 0,
    };
    layer.loadProgress = loadProgress;

    const layerType = this.determineLayerType(olLayer);

    if (!layerType) {
      return;
    }

    this.createLoadingProgressTimer(loadProgress, olLayer);
    const loadStart = this.subscribeToEventSubject(1, loadProgress, olLayer);
    const loadEnd = this.subscribeToEventSubject(-1, loadProgress, olLayer);

    source.on(`${layerType}loadstart`, (e) => {
      loadStart.next(true);
    });
    source.on(`${layerType}loadend`, (e) => {
      loadEnd.next(true);
      loadProgress.error = false;
    });
    source.on(`${layerType}loaderror`, (e) => {
      this.loadError(loadProgress, olLayer, this[`${layerType}LoadFailed`]);
    });
  }

  private determineLayerType(olLayer: Layer) {
    if (this.hsUtilsService.instOf(olLayer, VectorLayer)) {
      return 'features';
    } else if (this.hsUtilsService.instOf(olLayer, ImageLayer)) {
      return 'image';
    } else if (this.hsUtilsService.instOf(olLayer, Tile)) {
      return 'tile';
    }
    return undefined;
  }

  private loadError(
    loadProgress: HsLayerLoadProgress,
    olLayer: Layer<Source>,
    typeCallback?: (
      loadProgress: HsLayerLoadProgress,
      olLayer: Layer<Source>,
    ) => any,
  ) {
    loadProgress.loadError += 1;
    this.changeLoadCounter(olLayer, loadProgress, -1);
    if (typeCallback) {
      typeCallback.bind(this)(loadProgress, olLayer);
    }
  }

  private featuresLoadFailed(
    loadProgress: HsLayerLoadProgress,
    olLayer: Layer<Source>,
  ) {
    if (loadProgress) {
      loadProgress.error = true;
    }
    this.hsToastService.createToastPopupMessage(
      'LAYERS.featuresLoadError',
      `${getTitle(
        olLayer,
      )}: ${this.hsLanguageService.getTranslationIgnoreNonExisting(
        'ADDLAYERS.ERROR',
        'someErrorHappened',
        null,
      )}`,
      {},
    );
  }

  private imageLoadFailed(
    loadProgress: HsLayerLoadProgress,
    olLayer: Layer<Source>,
  ) {
    loadProgress.loaded = true;
    loadProgress.error = true;
  }

  private tileLoadFailed(
    loadProgress: HsLayerLoadProgress,
    olLayer: Layer<Source>,
  ) {
    if (loadProgress.loadError == loadProgress.total) {
      loadProgress.error = true;
    }
  }

  /**
   * Creates loading progress timer which controls the executions of load events callbacks
   * and tries to reset progress once the loading has finished (no execution in 2000ms)
   */
  private createLoadingProgressTimer(
    loadProgress: HsLayerLoadProgress,
    olLayer: Layer<Source>,
  ) {
    loadProgress.timer = new Subject();
    /**
     * NOTE:
     * pairwise is a hacky solution for the cases when pending numbers get out of sync
     * eg. everything has been loaded but pending value is not 0.
     * Could not find the root cause of the problem
     */
    loadProgress.timer
      .pipe(debounceTime(2000), pairwise())
      .subscribe(([previous, current]) => {
        if (
          loadProgress.pending == 0 ||
          (previous === current && current != 0)
        ) {
          this.zone.run(() => {
            loadProgress.total = 0;
            if (current != 0) {
              loadProgress.pending = 0;
            }
            loadProgress.percents = 0;
            this.hsEventBusService.layerLoaded.next(olLayer);
          });
        }
      });
  }

  /**
   * Create an event subject which is used to cast value in an event callback.
   * and
   * Subscribe to an subject to allow debouncing of event callback method.
   * Subscription increments or decrements pending parameter of loadProgress which is used to indicate progress in UI
   */
  private subscribeToEventSubject(
    signMultiplier: 1 | -1,
    loadProgress: HsLayerLoadProgress,
    olLayer: Layer<Source>,
  ): Subject<boolean> {
    const subject: Subject<boolean> = new Subject();
    subject
      .pipe(
        //Buffer emitions to an array until closing notifier emits.
        buffer(
          // In case 100ms has passed without another emit => close buffer and emit value
          subject.pipe(debounceTime(100)),
        ),
      )
      .subscribe((loads) => {
        loadProgress.total += signMultiplier == 1 ? loads.length : 0;
        this.changeLoadCounter(
          olLayer,
          loadProgress,
          loads.length * signMultiplier,
        );
      });
    return subject;
  }

  /**
   * Adjust layer progress counter object and calculate loading state (percentages)
   * change is positive number in case of loadStart and negative number in case of loadEnd/Error events
   */
  private changeLoadCounter(
    layer: Layer<Source>,
    progress: HsLayerLoadProgress,
    change: number,
  ): void {
    progress.pending += change;
    progress.loaded = progress.pending === 0;
    let percents = 0;
    if (progress.total > 0) {
      percents = Math.round(
        ((progress.total - progress.pending) / progress.total) * 100,
      );
    }
    /**
     * Total is reset only after 2 seconds of idle state.
     * Panning sooner will make a progress bar UI animation to jump or 'backpaddle' unnecessarily.
     * Using 0 instead of 100 (when loading ended) prevents that
     */
    this.zone.run(() => {
      progress.percents = percents === 100 ? 0 : percents;
    });
    progress.timer.next(progress.pending);
    if (change > 0) {
      this.hsEventBusService.layerLoading.next({layer, progress});
    }
  }
}
