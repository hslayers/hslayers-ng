import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';

import {Layer} from 'ol/layer';
import {Source} from 'ol/source';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {HsConfig} from '../../config.service';
import {HsCoreService} from '../core/core.service';
import {HsDialogContainerService} from '../layout/dialogs/dialog-container.service';
import {HsEventBusService} from '../core/event-bus.service';
import {HsLanguageService} from '../language/language.service';
import {HsLayerDescriptor} from './layer-descriptor.interface';
import {HsLayerListService} from './logical-list/layermanager-layerlist.service';
import {HsLayerManagerRemoveAllDialogComponent} from './dialogs/remove-all-dialog.component';
import {HsLayerManagerService} from './layermanager.service';
import {HsLayerSynchronizerService} from '../save-map/layer-synchronizer.service';
import {HsLayerUtilsService} from '../utils/layer-utils.service';
import {HsLayoutService} from '../layout/layout.service';
import {HsMapService} from '../map/map.service';
import {HsPanelBaseComponent} from '../layout/panels/panel-base.component';
import {HsSidebarService} from '../sidebar/sidebar.service';
import {HsUtilsService} from '../utils/utils.service';
import {
  getActive,
  getAttribution,
  getShowInLayerManager,
  getThumbnail,
  getTitle,
} from '../../common/layer-extensions';

@Component({
  selector: 'hs-layer-manager',
  templateUrl: './layermanager.html',
})
export class HsLayerManagerComponent
  extends HsPanelBaseComponent
  implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('layerEditor', {static: false, read: ElementRef})
  layerEditorRef: ElementRef;
  map: any;
  shiftDown = false;
  allLayersVisible = false;
  layerlistVisible: boolean;
  hovering: boolean;
  physicalLayerListEnabled = false;
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
  name = 'layermanager';
  layerTooltipDelay = 0;

  private end = new Subject<void>();
  constructor(
    public hsCore: HsCoreService,
    public hsUtilsService: HsUtilsService,
    public hsLayerUtilsService: HsLayerUtilsService,
    public hsMapService: HsMapService,
    public hsLayerManagerService: HsLayerManagerService,
    public hsLayoutService: HsLayoutService,
    public hsLayerSynchronizerService: HsLayerSynchronizerService,
    public hsEventBusService: HsEventBusService,
    public hsDialogContainerService: HsDialogContainerService,
    public hsLanguageService: HsLanguageService,
    public hsConfig: HsConfig,
    public hsLayerListService: HsLayerListService,
    public hsSidebarService: HsSidebarService
  ) {
    super(hsLayoutService);
    this.hsEventBusService.layerRemovals
      .pipe(takeUntil(this.end))
      .subscribe((layer) => {
        if (
          this.hsLayerManagerService?.currentLayer?.layer == layer &&
          this.hsUtilsService.runningInBrowser()
        ) {
          const layerNode = document.getElementsByClassName(
            'hs-lm-mapcontentlist'
          )[0];
          this.hsUtilsService.insertAfter(
            this.layerEditorRef.nativeElement,
            layerNode
          );
          this.hsLayerManagerService.currentLayer = null;
        }
      });

    this.hsEventBusService.compositionLoads
      .pipe(takeUntil(this.end))
      .subscribe((data) => {
        if (data.error == undefined) {
          if (data.data != undefined && data.data.id != undefined) {
            this.hsLayerManagerService.composition_id = data.data.id;
          } else if (data.id != undefined) {
            this.hsLayerManagerService.composition_id = data.id;
          } else {
            this.hsLayerManagerService.composition_id = null;
          }
        }
      });

    this.hsEventBusService.compositionDeletes
      .pipe(takeUntil(this.end))
      .subscribe((composition) => {
        if (composition.id == this.hsLayerManagerService.composition_id) {
          this.hsLayerManagerService.composition_id = null;
        }
      });

    this.hsMapService.loaded().then((map) => {
      this.hsLayerManagerService.changeResolutionHandler = map.getView().on(
        'change:resolution',
        this.hsUtilsService.debounce(
          (e) => this.hsLayerManagerService.resolutionChangeDebounceCallback(),
          200,
          false,
          this
        )
      );

      this.hsLayerManagerService.addLayerHandler = map
        .getLayers()
        .on('add', (e) => {
          this.hsLayerManagerService.applyZIndex(
            e.element as Layer<Source>,
            true
          );
          if (getShowInLayerManager(e.element) == false) {
            return;
          }
          this.hsLayerManagerService.layerAdded(e as any);
        });
      this.hsLayerManagerService.removeLayerHandler = map
        .getLayers()
        .on('remove', (e) => this.hsLayerManagerService.layerRemoved(e as any));
    });

    this.hsEventBusService.mapResets.pipe(takeUntil(this.end)).subscribe(() => {
      this.hsLayerManagerService.composition_id = null;
    });
  }
  ngOnDestroy(): void {
    this.hsLayerManagerService.destroy();
    this.end.next();
    this.end.complete();
  }

  ngOnInit(): void {
    this.hsSidebarService.addButton({
      panel: 'layermanager',
      module: 'hs.layermanager',
      order: 0,
      fits: true,
      title: 'PANEL_HEADER.LM',
      description: 'SIDEBAR.descriptions.LM',
      icon: 'icon-layers',
    });
    this.layerTooltipDelay = this.hsConfig.layerTooltipDelay;
    this.layerlistVisible = true;
  }

  ngAfterViewInit(): void {
    this.hsLayerManagerService.layerEditorElement =
      this.layerEditorRef.nativeElement;
  }
  changeBaseLayerVisibility(e?, layer?: Layer<Source>) {
    return this.hsLayerManagerService.changeBaseLayerVisibility(e, layer);
  }

  changeTerrainLayerVisibility(e, layer: Layer<Source>) {
    return this.hsLayerManagerService.changeTerrainLayerVisibility(e, layer);
  }

  changeLayerVisibility(toWhat: boolean, layer: HsLayerDescriptor) {
    return this.hsLayerManagerService.changeLayerVisibility(toWhat, layer);
  }

  setProp(layer: Layer<Source>, property, value): void {
    layer.set(property, value);
  }

  activateTheme(e) {
    return this.hsLayerManagerService.activateTheme(e);
  }

  baselayerFilter = (item): boolean => {
    const r = new RegExp(this.hsLayerManagerService.data.filter, 'i');
    return r.test(item.title);
  };

  filterLayerTitles(): void {
    this.hsEventBusService.layerManagerUpdates.next();
  }

  toggleVisibilityForAll(): void {
    this.allLayersVisible = !this.allLayersVisible;
    this.hsLayerManagerService.data.layers.forEach((l) => {
      this.hsLayerManagerService.changeLayerVisibility(
        this.allLayersVisible,
        l
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
   * Removes all layers which don't have 'removable' attribute
   * set to false if user confirms the removal. Might reload composition again.
   */
  removeAllLayers(): void {
    this.hsDialogContainerService.create(
      HsLayerManagerRemoveAllDialogComponent,
      {}
    );
  }

  /**
   * Determines if layer has copyright information available *
   * @param layer - Selected layer (HsLayerManagerService.currentLayer)
   */
  hasCopyright(layer: HsLayerDescriptor): boolean | undefined {
    if (!this.hsLayerManagerService.currentLayer) {
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
      (layer) => getThumbnail(layer) !== undefined
    );
  }

  /**
   * Test if layer (WMS) resolution is within map resolution interval
   * @param layer - Selected layer
   */
  isLayerInResolutionInterval(layer: Layer<Source>): boolean {
    return this.hsLayerManagerService.isLayerInResolutionInterval(layer);
  }

  /**
   * Test if selected layer is loaded in map
   * @param layer - Selected layer
   */
  layerLoaded(layer: HsLayerDescriptor): boolean {
    return this.hsLayerUtilsService.layerLoaded(layer);
  }
}
