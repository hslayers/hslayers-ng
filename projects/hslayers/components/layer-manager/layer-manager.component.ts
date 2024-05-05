import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Layer} from 'ol/layer';
import {
  Observable,
  Subject,
  fromEvent,
  merge,
  of,
  throwError,
  timer,
} from 'rxjs';
import {Source} from 'ol/source';
import {
  catchError,
  debounce,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  retry,
  share,
  startWith,
  switchMap,
  take,
  takeUntil,
} from 'rxjs/operators';

import {
  HsBaseLayerDescriptor,
  HsLayerDescriptor,
  HsTerrainLayerDescriptor,
} from 'hslayers-ng/types';
import {HsCommonLaymanService} from 'hslayers-ng/common/layman';
import {HsConfig} from 'hslayers-ng/config';
import {HsDialogContainerService} from 'hslayers-ng/common/dialogs';
import {HsEventBusService} from 'hslayers-ng/services/event-bus';
import {HsLayerListService} from './logical-list/layer-manager-layerlist.service';
import {HsLayerManagerRemoveAllDialogComponent} from './dialogs/remove-all-dialog.component';
import {
  HsLayerManagerService,
  HsLayerManagerVisibilityService,
  HsLayerSelectorService,
} from 'hslayers-ng/services/layer-manager';
import {HsPanelBaseComponent} from 'hslayers-ng/common/panels';
import {HsRemoveLayerDialogService} from 'hslayers-ng/common/remove-multiple';
import {HsUtilsService} from 'hslayers-ng/services/utils';
import {HslayersService} from 'hslayers-ng/core';
import {
  getActive,
  getAttribution,
  getThumbnail,
  getTitle,
} from 'hslayers-ng/common/extensions';

@Component({
  selector: 'hs-layer-manager',
  templateUrl: './layer-manager.component.html',
})
export class HsLayerManagerComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  layerEditorRef: ElementRef;
  @ViewChild('layerEditor', {static: false, read: ElementRef}) set content(
    content: ElementRef,
  ) {
    if (content) {
      // initially setter gets called with undefined
      this.layerEditorRef = content;
      this.hsLayerManagerService.layerEditorElement = content.nativeElement;
    }
  }
  @ViewChild('filterInput', {static: false}) filterInput: ElementRef;

  filteredBaselayers$: Observable<HsBaseLayerDescriptor[]>;
  filteredTerrainlayers$: Observable<HsTerrainLayerDescriptor[]>;

  map: any;
  shiftDown = false;
  allLayersVisible = false;
  composition_id: string;
  layerlistVisible: boolean;
  hovering: boolean;
  physicalLayerListEnabled = false;
  cesiumActive$: Observable<boolean>;
  icons = [
    'bag1.svg',
    'banking4.svg',
    'bar.svg',
    'beach17.svg',
    'bicycles.svg',
    'building103.svg',
    'bus4.svg',
    'cabinet9.svg',
    'camping13.svg',
    'caravan.svg',
    'church15.svg',
    'church1.svg',
    'coffee-shop1.svg',
    'disabled.svg',
    'favourite28.svg',
    'football1.svg',
    'footprint.svg',
    'gift-shop.svg',
    'gps40.svg',
    'gps41.svg',
    'gps42.svg',
    'gps43.svg',
    'gps5.svg',
    'hospital.svg',
    'hot-air-balloon2.svg',
    'information78.svg',
    'library21.svg',
    'location6.svg',
    'luggage13.svg',
    'monument1.svg',
    'mountain42.svg',
    'museum35.svg',
    'park11.svg',
    'parking28.svg',
    'pharmacy17.svg',
    'port2.svg',
    'restaurant52.svg',
    'road-sign1.svg',
    'sailing-boat2.svg',
    'ski1.svg',
    'swimming26.svg',
    'telephone119.svg',
    'toilets2.svg',
    'train-station.svg',
    'university2.svg',
    'warning.svg',
    'wifi8.svg',
  ];
  getActive = getActive;
  getTitle = getTitle;
  getThumbnail = getThumbnail;
  name = 'layerManager';
  layerTooltipDelay = 0;

  private end = new Subject<void>();
  constructor(
    public hsCore: HslayersService,
    public hsUtilsService: HsUtilsService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsEventBusService: HsEventBusService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsConfig: HsConfig,
    public hsLayerListService: HsLayerListService,
    private HsRemoveLayerDialogService: HsRemoveLayerDialogService,
    public hsLayerSelectorService: HsLayerSelectorService,
    public hsLayerManagerVisibilityService: HsLayerManagerVisibilityService,
    private hsCommonLaymanService: HsCommonLaymanService,
  ) {
    super();
    this.cesiumActive$ = merge(
      this.hsEventBusService.cesiumLoads.pipe(
        map(({service}) => service !== null),
      ),
      this.hsEventBusService.mapLibraryChanges.pipe(
        map((lib) => lib === 'cesium'),
      ),
    ).pipe(startWith(false));

    this.hsEventBusService.layerRemovals
      .pipe(takeUntil(this.end))
      .subscribe((layer) => {
        if (
          this.hsLayerSelectorService?.currentLayer?.layer == layer &&
          this.hsUtilsService.runningInBrowser()
        ) {
          const layerNode = document.getElementsByClassName(
            'hs-lm-mapcontentlist',
          )[0];
          this.hsUtilsService.insertAfter(
            this.layerEditorRef.nativeElement,
            layerNode,
          );
          this.hsLayerSelectorService.currentLayer = null;
        }
      });

    this.hsEventBusService.compositionLoads
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
        if (data.error == undefined) {
          if (data.data != undefined && data.data.id != undefined) {
            this.composition_id = data.data.id;
          } else if (data.id != undefined) {
            this.composition_id = data.id;
          } else {
            this.composition_id = null;
          }
        }
      });

    this.hsEventBusService.compositionDeletes
      .pipe(takeUntil(this.end))
      .subscribe((composition) => {
        if (composition.id == this.composition_id) {
          this.composition_id = null;
        }
      });

    this.hsEventBusService.mapResets.pipe(takeUntil(this.end)).subscribe(() => {
      this.composition_id = null;
    });
  }

  /**
   * Used in template to preserve order of data.folders map entries
   */
  keepOrder = (a, b) => {
    return 0; // This will keep the order as is in the Map
  };

  ngAfterViewInit() {
    /**
     * Define string filter declared in service
     */
    this.hsLayerManagerService.data.filter = this.isVisible$.pipe(
      /**
       * Component is constructed despite not being visible (mainPanel) on app init
       * Thus we cannot keep constructing this stream until layermanager is actually visible
       * (input is available)
       */
      filter((visible) => !!visible),
      //Make sure filterInput is created
      debounceTime(0),
      //Take only the first successful emission
      take(1),
      //Switch to 'input' event of filterInput
      switchMap(() =>
        fromEvent(this.filterInput.nativeElement, 'input').pipe(
          //Extract event value (or use '' as default) and add index to to result value
          map((event: any, index) => [event.target.value as string, index]),
          //Init with empty string and no debounce
          startWith(['', 0]),
          //Use index to determine timer value. No debounce on init
          debounce(([_, index]: [string, number]) =>
            timer(index === 0 ? 0 : 300),
          ),
          //Return only fitler string
          map(([value, _]) => value),
          distinctUntilChanged(),
        ),
      ),
      //Share result instead of executing separately for each subscriber
      share(),
    );

    this.filteredBaselayers$ = this.createFilteredLayerObservable('baselayers');
    //TODO: This should not be necessary for all hsl app
    this.filteredTerrainlayers$ =
      this.createFilteredLayerObservable('terrainLayers');
  }

  /**
   * Create observable with error handling for selected layer type
   */
  // Overload signatures
  createFilteredLayerObservable(
    type: 'baselayers',
  ): Observable<HsBaseLayerDescriptor[]>;
  createFilteredLayerObservable(
    type: 'terrainLayers',
  ): Observable<HsTerrainLayerDescriptor[]>;

  //Implementation
  createFilteredLayerObservable(
    type: 'baselayers' | 'terrainLayers',
  ): Observable<HsBaseLayerDescriptor[] | HsTerrainLayerDescriptor[]> {
    return this.hsLayerManagerService.data.filter.pipe(
      switchMap((filter) => {
        if (this.hsLayerManagerService.data[type].length === 0) {
          return throwError(() => new Error(`No ${type} found`));
        }
        return of(filter);
      }),
      map((filter) => this.filterLayers(filter, type)),
      retry({count: 3, delay: 50}),
      catchError((err) => this.handleFilterLayerError(err, type)),
    );
  }

  private handleFilterLayerError<T extends 'baselayers' | 'terrainLayers'>(
    err: any,
    type: T,
  ): Observable<HsBaseLayerDescriptor[] | HsTerrainLayerDescriptor[]> {
    console.error(`Error filtering ${type}`, err);
    if (err.message === `No ${type} found`) {
      return this.emptyResult(type);
    }
    return this.emptyResult(type);
  }

  /**
   * Return empty layers result as a result of error while filtering
   */
  private emptyResult<T extends 'baselayers' | 'terrainLayers'>(
    type: T,
  ): Observable<HsBaseLayerDescriptor[] | HsTerrainLayerDescriptor[]> {
    return type === 'baselayers'
      ? of([] as HsBaseLayerDescriptor[])
      : of([] as HsTerrainLayerDescriptor[]);
  }

  ngOnDestroy(): void {
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.layerTooltipDelay = this.hsConfig.layerTooltipDelay;
    this.layerlistVisible = true;
    super.ngOnInit();
  }

  changeBaseLayerVisibility(e?, layer?: HsBaseLayerDescriptor) {
    return this.hsLayerManagerVisibilityService.changeBaseLayerVisibility(
      e,
      layer,
    );
  }

  changeTerrainLayerVisibility(e, layer: HsTerrainLayerDescriptor) {
    return this.hsLayerManagerVisibilityService.changeTerrainLayerVisibility(
      e,
      layer,
    );
  }

  changeLayerVisibility(toWhat: boolean, layer: HsLayerDescriptor) {
    return this.hsLayerManagerVisibilityService.changeLayerVisibility(
      toWhat,
      layer,
    );
  }

  setProp(layer: Layer<Source>, property, value): void {
    layer.set(property, value);
  }

  activateTheme(e) {
    return this.hsLayerManagerVisibilityService.activateTheme(e);
  }

  filterLayers(
    filter: string,
    type: 'baselayers' | 'terrainLayers',
  ): HsBaseLayerDescriptor[] | HsTerrainLayerDescriptor[] {
    const r = new RegExp(filter, 'i');
    if (type === 'baselayers') {
      // Filter and cast to HsBaseLayerDescriptor[]
      return this.hsLayerManagerService.data.baselayers.filter(
        (layer) => r.test(layer.title) && layer.showInLayerManager,
      ) as HsBaseLayerDescriptor[];
    } else {
      // Filter and cast to HsTerrainLayerDescriptor[]
      return this.hsLayerManagerService.data.terrainLayers.filter((layer) =>
        r.test(layer.title),
      ) as HsTerrainLayerDescriptor[];
    }
  }

  toggleVisibilityForAll(): void {
    this.allLayersVisible = !this.allLayersVisible;
    this.hsLayerManagerService.data.layers.forEach((l) => {
      this.hsLayerManagerVisibilityService.changeLayerVisibility(
        this.allLayersVisible,
        l,
      );
      this.hsLayerListService.toggleSublayersVisibility(l);
    });
  }

  /**
   * Removes layer from map object
   * @param layer - Layer to remove
   */
  removeLayer(layer: Layer<Source>): void {
    this.map.removeLayer(layer);
  }

  /**
   * Creates remove-layer dialog which allows for single/multiple layer removal
   */
  removeMultipleLayers() {
    this.HsRemoveLayerDialogService.removeMultipleLayers(
      this.hsLayerManagerService.data.layers
        .filter((layer) => layer.showInLayerManager)
        .map((l) => {
          return l.layer;
        }),
      this.hsCommonLaymanService.layman?.authenticated
        ? ['map', 'mapcatalogue']
        : ['map'],
    );
  }

  /**
   * Removes all layers which don't have 'removable' attribute
   * set to false if user confirms the removal. Might reload composition again.
   */
  removeAllLayers(): void {
    this.hsDialogContainerService.create(
      HsLayerManagerRemoveAllDialogComponent,
      {
        composition_id: this.composition_id,
      },
    );
  }
  /**
   * Determines if layer has copyright information available *
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
    if (!this.hsLayerSelectorService.currentLayer) {
      return;
    } else {
      return getAttribution(layer.layer)?.onlineResource != undefined;
    }
  }

  /**
   * Test if box layers are loaded
   */
  hasBoxImages(): boolean {
    return this.hsLayerManagerService.data.box_layers?.some(
      (layer) => getThumbnail(layer) !== undefined,
    );
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param layer - Selected layer
   */
  isLayerInResolutionInterval(layer: Layer<Source>): boolean {
    return this.hsLayerManagerVisibilityService.isLayerInResolutionInterval(
      layer,
    );
  }
}
